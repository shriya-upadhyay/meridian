import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { CreateProposalRequest } from '../types';
import { screenTransaction } from '../complianceService';

const router = Router();

/**
 * Extract the contract ID of the newly created contract from a Canton v2
 * submit-and-wait exercise response.
 *
 * Canton v2 returns transaction results in several possible shapes:
 *   - { result: { events: [ { CreatedEvent: { contractId } } ] } }
 *   - { result: { exercise_result: "<contractId>" } }
 *   - { updateId, completionOffset, ... } with events nested
 *
 * We walk through all known paths to find the created contract ID.
 */
function extractCreatedContractId(response: any): string | null {
  if (!response) return null;

  // Path 1: Direct exercise_result string
  const exResult = response?.result?.exercise_result ?? response?.exercise_result;
  if (typeof exResult === 'string') return exResult;

  // Path 2: Look in events array for CreatedEvent
  const events =
    response?.result?.events ||
    response?.events ||
    response?.result?.transaction?.events ||
    response?.transaction?.events ||
    [];

  for (const ev of events) {
    const created =
      ev?.CreatedEvent ||
      ev?.createdEvent ||
      ev?.Created ||
      ev?.created;
    if (created?.contractId) return created.contractId;
  }

  // Path 3: Maybe the whole result is a string (direct contractId)
  if (typeof response === 'string') return response;

  console.warn('Could not extract contractId from exercise result:', JSON.stringify(response, null, 2));
  return null;
}

/**
 * Off-chain cache for sensitive proposal data (senderInfo, recipientInfo, declaration).
 * The CrossBorderTx contract on-ledger holds only non-sensitive shared fields.
 * When views are created during accept, we need the full details — so we cache them
 * here at proposal creation time, keyed by txId.
 *
 * In production this would be a database; for the demo an in-memory map suffices.
 */
const proposalDataCache: Map<string, {
  senderInfo: any;
  recipientInfo: any;
  declaration: any;
}> = new Map();

/**
 * GET /api/proposals?party=<partyId>
 * List all CrossBorderTx contracts in "Proposed" status visible to the party.
 * (In the new multi-party-agreement model, proposals are just CrossBorderTx
 *  contracts where status == Proposed and signatories == [sender].)
 */
router.get('/', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'CrossBorderTx');
    // Filter to only Proposed-status contracts (i.e. pending proposals)
    const proposals = contracts.filter((c: any) => c.payload?.status === 'Proposed');
    res.json(proposals);
  } catch (error: any) {
    console.error('Error listing proposals:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/proposals?party=<senderPartyId>
 * Create a new CrossBorderTx in Proposed state.
 * Only the sender signs — recipient and regulator are observers.
 */
router.post('/', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  const data: CreateProposalRequest = req.body;

  try {
    const now = new Date().toISOString();

    // Resolve display names to full party IDs for the DAML contract
    const senderFullId = ledger.resolveParty(party);
    const recipientFullId = ledger.resolveParty(data.recipient);
    const regulatorFullId = ledger.resolveParty(data.regulator);

    const payload = {
      sender: senderFullId,
      recipient: recipientFullId,
      regulator: regulatorFullId,
      signatories: [senderFullId],
      observers: [recipientFullId, regulatorFullId],
      txId: data.txId,
      amount: data.amount,
      sendCurrency: data.sendCurrency,
      receiveCurrency: data.receiveCurrency,
      senderName: data.senderInfo.senderName,
      senderCountry: data.senderInfo.senderCountry,
      recipientName: data.recipientInfo.recipientName,
      recipientCountry: data.recipientInfo.recipientCountry,
      recipientAccountHash: data.recipientInfo.recipientAccountHash,
      status: 'Proposed',
      fxRate: {
        fromCurrency: data.sendCurrency,
        toCurrency: data.receiveCurrency,
        rate: '0.7923',
        rateTimestamp: now,
        rateProvider: 'Reuters',
      },
      createdAt: now,
    };

    // Cache sensitive data off-chain for view creation during accept
    proposalDataCache.set(data.txId, {
      senderInfo: data.senderInfo,
      recipientInfo: data.recipientInfo,
      declaration: data.declaration,
    });

    // Only the sender signs — no regulator co-signing needed
    const result = await ledger.createContract(
      [senderFullId],
      'CrossBorderTx',
      payload
    );

    console.log(`✓ Proposal created: txId=${data.txId}, sender=${party}, recipient=${data.recipient}, amount=${data.amount} ${data.sendCurrency} → ${data.receiveCurrency}`);
    res.status(201).json({ status: 'created', result });
  } catch (error: any) {
    console.error('Error creating proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/proposals/:contractId/accept?party=<recipientPartyId>
 * Recipient accepts a proposal via AcceptProposal choice on CrossBorderTx.
 * This moves the contract from Proposed → Approved and adds recipient to signatories.
 * Then creates SenderView, RecipientView, and RegulatorView as separate steps.
 */
router.post('/:contractId/accept', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    // Step 1: Query the proposal to get transaction details for screening
    const allTx = await ledger.queryContracts(party, 'CrossBorderTx');
    const proposal = allTx.find((p: any) => p.contractId === contractId);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Step 2: Retrieve cached sensitive data
    const txId = proposal.payload?.txId;
    const cached = txId ? proposalDataCache.get(txId) : null;

    // Step 3: Run automated compliance screening
    const screening = screenTransaction({
      senderName: proposal.payload?.senderName || '',
      senderCountry: proposal.payload?.senderCountry || '',
      recipientName: proposal.payload?.recipientName || '',
      recipientBic: cached?.recipientInfo?.recipientBankSwift || '',
      amount: proposal.payload?.amount || '0',
      currency: proposal.payload?.sendCurrency || 'USD',
      purposeOfPayment: cached?.declaration?.purposeOfPayment || '',
      sourceOfFunds: cached?.declaration?.sourceOfFunds || '',
    });

    // Step 4: Exercise AcceptProposal — returns a single ContractId CrossBorderTx
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'AcceptProposal',
      {}
    );

    // Extract the new contract ID from the Canton v2 submit-and-wait response.
    // The response contains transaction events — we need the Created event's contractId.
    console.log('AcceptProposal raw result:', JSON.stringify(result, null, 2));
    const txCid = extractCreatedContractId(result);

    // Step 5: Regulator joins as signatory (JoinAsRegulator choice)
    // This archives the current contract and creates a new one, so we track the latest CID.
    const regulatorHint = proposal.payload?.regulator;
    let currentTxCid = txCid;
    if (currentTxCid && regulatorHint) {
      try {
        const joinResult = await ledger.exerciseChoice(
          regulatorHint,
          'CrossBorderTx',
          currentTxCid,
          'JoinAsRegulator',
          {}
        );
        const newCid = extractCreatedContractId(joinResult);
        if (newCid) currentTxCid = newCid;
        console.log(`✓ Regulator joined as signatory for txCid=${currentTxCid}`);
      } catch (regError: any) {
        console.warn(`Warning: Regulator failed to join:`, regError?.response?.data || regError.message);
      }
    }

    // Step 6: Create view contracts (each party creates their own view)
    // Use currentTxCid which is the latest contract ID after all parties joined.
    const senderHint = proposal.payload?.sender;
    let senderViewCid = null;
    let recipientViewCid = null;
    let regulatorViewCid = null;

    // Build view payloads from the off-chain cache (or fallback to partial on-ledger data)
    const senderInfo = cached?.senderInfo || {
      senderName: proposal.payload?.senderName || '',
      senderAccount: '',
      senderBankSwift: '',
      senderCountry: proposal.payload?.senderCountry || '',
      senderTaxId: '',
    };
    const recipientInfo = cached?.recipientInfo || {
      recipientName: proposal.payload?.recipientName || '',
      recipientAccount: '',
      recipientBankSwift: '',
      recipientCountry: proposal.payload?.recipientCountry || '',
      recipientTaxId: '',
      recipientAccountHash: proposal.payload?.recipientAccountHash || '',
    };
    const declaration = cached?.declaration || {
      purposeOfPayment: '',
      sourceOfFunds: '',
    };

    // Sender creates SenderView
    if (txCid && senderHint) {
      try {
        const svResult = await ledger.exerciseChoice(
          senderHint,
          'CrossBorderTx',
          txCid,
          'CreateSenderView',
          { senderInfo }
        );
        senderViewCid = svResult?.result?.exercise_result || svResult?.exercise_result || null;
        console.log(`✓ SenderView created for txCid=${txCid}`);
      } catch (svError: any) {
        console.warn(`Warning: Failed to create SenderView:`, svError?.response?.data || svError.message);
      }
    }

    // Recipient creates RecipientView
    if (txCid) {
      try {
        const rvResult = await ledger.exerciseChoice(
          party,
          'CrossBorderTx',
          txCid,
          'CreateRecipientView',
          { recipientInfo }
        );
        recipientViewCid = rvResult?.result?.exercise_result || rvResult?.exercise_result || null;
        console.log(`✓ RecipientView created for txCid=${txCid}`);
      } catch (rvError: any) {
        console.warn(`Warning: Failed to create RecipientView:`, rvError?.response?.data || rvError.message);
      }
    }

    // Regulator creates RegulatorView
    if (txCid && regulatorHint) {
      try {
        const regResult = await ledger.exerciseChoice(
          regulatorHint,
          'CrossBorderTx',
          txCid,
          'CreateRegulatorView',
          { senderInfo, recipientInfo, declaration, screening }
        );
        regulatorViewCid = regResult?.result?.exercise_result || regResult?.exercise_result || null;
        console.log(`✓ RegulatorView created for txCid=${txCid}`);
      } catch (regError: any) {
        console.warn(`Warning: Failed to create RegulatorView:`, regError?.response?.data || regError.message);
      }
    }

    // Clean up cache after views are created
    if (txId) {
      proposalDataCache.delete(txId);
    }

    console.log(`✓ Proposal accepted: contractId=${contractId}, riskScore=${screening.riskScore}, by=${party}`);
    res.json({
      status: 'accepted',
      screening,
      txCid,
      senderViewCid,
      recipientViewCid,
      regulatorViewCid,
      raw: result,
    });
  } catch (error: any) {
    console.error('Error accepting proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/proposals/:contractId/withdraw?party=<senderPartyId>
 * Sender withdraws a proposal (exercises WithdrawProposal on CrossBorderTx).
 */
router.post('/:contractId/withdraw', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'WithdrawProposal',
      {}
    );
    console.log(`✓ Proposal withdrawn: contractId=${contractId}, by=${party}`);
    res.json({ status: 'withdrawn', result });
  } catch (error: any) {
    console.error('Error withdrawing proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
