import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

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
 * POST /api/transactions/:contractId/freeze?party=<regulatorPartyId>
 * Regulator freezes a suspicious transaction.
 * A frozen transaction cannot be settled by the sender.
 */
router.post('/:contractId/freeze', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const result = await ledger.exerciseChoice(
      party,
      'CrossBorderTx',
      contractId,
      'Freeze',
      {}
    );
    console.log(`✓ Transaction frozen: contractId=${contractId}, by=${party}`);
    res.json({ status: 'frozen', result });
  } catch (error: any) {
    console.error('Error freezing transaction:', error?.response?.data || error.message);
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
    console.log(`✓ Transaction settled: contractId=${contractId}, by=${party}`);
    res.json({ status: 'settled', result });
  } catch (error: any) {
    console.error('Error settling transaction:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
