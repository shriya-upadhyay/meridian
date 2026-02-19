"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ledger_1 = require("../ledger");
const router = (0, express_1.Router)();
/**
 * GET /api/sender-views?party=<partyId>
 * List SenderView contracts visible to the party.
 */
router.get('/sender-views', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const contracts = await ledger_1.ledger.queryContracts(party, 'SenderView');
        res.json(contracts);
    }
    catch (error) {
        console.error('Error listing sender views:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/recipient-views?party=<partyId>
 * List RecipientView contracts visible to the party.
 */
router.get('/recipient-views', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const contracts = await ledger_1.ledger.queryContracts(party, 'RecipientView');
        res.json(contracts);
    }
    catch (error) {
        console.error('Error listing recipient views:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/regulator-views?party=<partyId>
 * List RegulatorView contracts visible to the party (regulator only).
 */
router.get('/regulator-views', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const contracts = await ledger_1.ledger.queryContracts(party, 'RegulatorView');
        res.json(contracts);
    }
    catch (error) {
        console.error('Error listing regulator views:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/regulator-views/:contractId/flag?party=<regulatorPartyId>
 * Regulator flags a transaction as suspicious with notes.
 */
router.post('/regulator-views/:contractId/flag', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    const { notes } = req.body;
    if (!notes) {
        return res.status(400).json({ error: 'notes is required' });
    }
    try {
        const result = await ledger_1.ledger.exerciseChoice(party, 'RegulatorView', contractId, 'FlagSuspicious', { notes });
        res.json({ status: 'flagged', result });
    }
    catch (error) {
        console.error('Error flagging transaction:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
exports.default = router;
