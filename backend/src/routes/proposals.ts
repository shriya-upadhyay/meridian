import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { CreateProposalRequest } from '../types';
import { resolveByBic } from '../identityService';
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
 *
 * The sender provides:
 *   - Their own bank details (senderInfo)
 *   - A declaration (purpose of payment, source of funds)
 *   - Recipient's public info (institution name + BIC code)
 *
 * The sender does NOT provide compliance screening (risk score, AML notes) —
 * that's produced by the regulator's screening service at acceptance time.
 */
router.post('/', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  const data: CreateProposalRequest = req.body;

  try {
    const now = new Date().toISOString();

    const payload = {
      sender: party,
      recipient: data.recipient,
      regulator: data.regulator,
      txId: data.txId,
      senderInfo: data.senderInfo,
      recipientName: data.recipientName,
      recipientBic: data.recipientBic,
      declaration: data.declaration,  // Sender's own declaration only
      amount: data.amount,
      currency: data.currency,
      createdAt: now,
    };

    // Both sender and regulator must sign the proposal
    const result = await ledger.createContract(
      [party, data.regulator],
      'CrossBorderTxProposal',
      payload
    );

    res.status(201).json({ status: 'created', result });
  } catch (error: any) {
    console.error('Error creating proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/proposals/:contractId/accept?party=<recipientPartyId>
 * Recipient accepts a proposal, creating the fan-out view contracts.
 *
 * Two things happen automatically at acceptance:
 *   1. Recipient's full bank details are resolved from BIC (identity service)
 *   2. Compliance screening is run by the regulator's service (risk score, AML checks)
 *
 * The recipient just clicks "Accept" — no form input needed.
 */
router.post('/:contractId/accept', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    // Step 1: Query the proposal to get BIC + declaration
    const proposals = await ledger.queryContracts(party, 'CrossBorderTxProposal');
    const proposal = proposals.find((p: any) => p.contractId === contractId);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const bic = proposal.payload?.recipientBic;
    if (!bic) {
      return res.status(400).json({ error: 'No BIC code found on proposal' });
    }

    // Step 2: Resolve full recipient details from BIC (off-chain identity service)
    const recipientInfo = resolveByBic(bic);
    if (!recipientInfo) {
      return res.status(400).json({ error: `Unknown BIC code: ${bic}. Cannot resolve recipient details.` });
    }

    // Step 3: Run automated compliance screening (regulator's service)
    const screening = screenTransaction({
      senderName: proposal.payload?.senderInfo?.senderName || '',
      senderCountry: proposal.payload?.senderInfo?.senderCountry || '',
      recipientName: recipientInfo.recipientName,
      recipientBic: bic,
      amount: proposal.payload?.amount || '0',
      currency: proposal.payload?.currency || 'USD',
      purposeOfPayment: proposal.payload?.declaration?.purposeOfPayment || '',
      sourceOfFunds: proposal.payload?.declaration?.sourceOfFunds || '',
    });

    // Step 4: Exercise AcceptProposal with resolved recipient details + screening results
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTxProposal',
      contractId,
      'AcceptProposal',
      { recipientInfo, screening }
    );

    // The result contains a 4-tuple: (txCid, senderViewCid, recipientViewCid, regulatorViewCid)
    const exerciseResult = result?.result?.exercise_result || result?.exercise_result || result;

    res.json({
      status: 'accepted',
      screening,  // Return the screening result so the caller can see it
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
    res.json({ status: 'withdrawn', result });
  } catch (error: any) {
    console.error('Error withdrawing proposal:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
