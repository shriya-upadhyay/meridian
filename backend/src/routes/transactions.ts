import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { ApproveRequest, RejectRequest } from '../types';

const router = Router();

/**
 * GET /api/transactions?party=<partyId>
 * List all CrossBorderTx contracts visible to the party.
 */
router.get('/', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'CrossBorderTx');
    res.json(contracts);
  } catch (error: any) {
    console.error('Error listing transactions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/:contractId/approve?party=<regulatorPartyId>
 * Regulator approves a transaction. Requires senderViewCid and recipientViewCid.
 */
router.post('/:contractId/approve', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  const { senderViewCid, recipientViewCid }: ApproveRequest = req.body;
  if (!senderViewCid || !recipientViewCid) {
    return res.status(400).json({ error: 'senderViewCid and recipientViewCid are required' });
  }

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'Approve',
      { senderViewCid, recipientViewCid }
    );
    res.json({ status: 'approved', result });
  } catch (error: any) {
    console.error('Error approving transaction:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/transactions/:contractId/reject?party=<regulatorPartyId>
 * Regulator rejects a transaction with a reason.
 */
router.post('/:contractId/reject', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  const { reason }: RejectRequest = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'reason is required' });
  }

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'Reject',
      { reason }
    );
    res.json({ status: 'rejected', result });
  } catch (error: any) {
    console.error('Error rejecting transaction:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

/**
 * POST /api/transactions/:contractId/settle?party=<senderPartyId>
 * Sender settles an approved transaction.
 */
router.post('/:contractId/settle', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'Settle',
      {}
    );
    res.json({ status: 'settled', result });
  } catch (error: any) {
    console.error('Error settling transaction:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
