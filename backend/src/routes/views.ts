import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { FlagRequest } from '../types';

const router = Router();

/**
 * GET /api/sender-views?party=<partyId>
 * List SenderView contracts visible to the party.
 */
router.get('/sender-views', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'SenderView');
    res.json(contracts);
  } catch (error: any) {
    console.error('Error listing sender views:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recipient-views?party=<partyId>
 * List RecipientView contracts visible to the party.
 */
router.get('/recipient-views', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'RecipientView');
    res.json(contracts);
  } catch (error: any) {
    console.error('Error listing recipient views:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/regulator-views?party=<partyId>
 * List RegulatorView contracts visible to the party (regulator only).
 */
router.get('/regulator-views', async (req: Request, res: Response) => {
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  try {
    const contracts = await ledger.queryContracts(party, 'RegulatorView');
    res.json(contracts);
  } catch (error: any) {
    console.error('Error listing regulator views:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/regulator-views/:contractId/flag?party=<regulatorPartyId>
 * Regulator flags a transaction as suspicious with notes.
 */
router.post('/regulator-views/:contractId/flag', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const party = req.query.party as string;
  if (!party) return res.status(400).json({ error: 'party query param required' });

  const { notes }: FlagRequest = req.body;
  if (!notes) {
    return res.status(400).json({ error: 'notes is required' });
  }

  try {
    const result = await ledger.exerciseChoice(
      party,
      'RegulatorView',
      contractId,
      'FlagSuspicious',
      { notes }
    );
    res.json({ status: 'flagged', result });
  } catch (error: any) {
    console.error('Error flagging transaction:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
