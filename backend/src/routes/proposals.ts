import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { CreateProposalRequest } from '../types';
import { screenTransaction } from '../complianceService';

const router = Router();

/**
 * GET /api/proposals?party=<partyId>
 * List all CrossBorderTxProposal contracts visible to the party.
 */
router.get('/', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'CrossBorderTxProposal');
    res.json(contracts);
  } catch (error: any) {
    console.error('Error listing proposals:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/proposals?party=<senderPartyId>
 * Create a new CrossBorderTxProposal.
 * Both sender and regulator must sign, so we pass both as actAs parties.
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
      txId: data.txId,
      senderInfo: data.senderInfo,
      recipientInfo: data.recipientInfo,
      declaration: data.declaration,
      amount: data.amount,
      sendCurrency: data.sendCurrency,
      receiveCurrency: data.receiveCurrency,
      fxRate: {
        fromCurrency: data.sendCurrency,
        toCurrency: data.receiveCurrency,
        rate: '0.7923',
        rateTimestamp: now,
        rateProvider: 'Reuters',
      },
      createdAt: now,
    };

    // Both sender and regulator must sign the proposal
    const result = await ledger.createContract(
  [senderFullId, regulatorFullId],
  'CrossBorderTxProposal',
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
 * Recipient accepts a proposal, creating the fan-out view contracts.
 */
router.post('/:contractId/accept', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    // Step 1: Query the proposal to get transaction details for screening
    const proposals = await ledger.queryContracts(party, 'CrossBorderTxProposal');
    const proposal = proposals.find((p: any) => p.contractId === contractId);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Step 2: Run automated compliance screening
    const screening = screenTransaction({
      senderName: proposal.payload?.senderInfo?.senderName || '',
      senderCountry: proposal.payload?.senderInfo?.senderCountry || '',
      recipientName: proposal.payload?.recipientInfo?.recipientName || '',
      recipientBic: proposal.payload?.recipientInfo?.recipientBankSwift || '',
      amount: proposal.payload?.amount || '0',
      currency: proposal.payload?.sendCurrency || 'USD',
      purposeOfPayment: proposal.payload?.declaration?.purposeOfPayment || '',
      sourceOfFunds: proposal.payload?.declaration?.sourceOfFunds || '',
    });

    // Step 3: Exercise AcceptProposal with screening results
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTxProposal',
      contractId,
      'AcceptProposal',
      { screening }
    );

    const exerciseResult = result?.result?.exercise_result || result?.exercise_result || result;

    console.log(`✓ Proposal accepted: contractId=${contractId}, riskScore=${screening.riskScore}, by=${party}`);
    res.json({
      status: 'accepted',
      screening,
      txCid: exerciseResult?.[0],
      senderViewCid: exerciseResult?.[1],
      recipientViewCid: exerciseResult?.[2],
      regulatorViewCid: exerciseResult?.[3],
      raw: result,
    });
  } catch (error: any) {
    console.error('Error accepting proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/proposals/:contractId/withdraw?party=<senderPartyId>
 * Sender withdraws a proposal.
 */
router.post('/:contractId/withdraw', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTxProposal',
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
