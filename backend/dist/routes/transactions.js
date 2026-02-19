"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ledger_1 = require("../ledger");
const router = (0, express_1.Router)();
/**
 * GET /api/transactions?party=<partyId>
 * List all CrossBorderTx contracts visible to the party.
 */
router.get('/', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const contracts = await ledger_1.ledger.queryContracts(party, 'CrossBorderTx');
        res.json(contracts);
    }
    catch (error) {
        console.error('Error listing transactions:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/transactions/:contractId/approve?party=<regulatorPartyId>
 * Regulator approves a transaction. Requires senderViewCid and recipientViewCid.
 */
router.post('/:contractId/approve', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    const { senderViewCid, recipientViewCid } = req.body;
    if (!senderViewCid || !recipientViewCid) {
        return res.status(400).json({ error: 'senderViewCid and recipientViewCid are required' });
    }
    try {
        const result = await ledger_1.ledger.exerciseChoice(party, 'CrossBorderTx', contractId, 'Approve', { senderViewCid, recipientViewCid });
        res.json({ status: 'approved', result });
    }
    catch (error) {
        console.error('Error approving transaction:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
/**
 * POST /api/transactions/:contractId/reject?party=<regulatorPartyId>
 * Regulator rejects a transaction with a reason.
 */
router.post('/:contractId/reject', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ error: 'reason is required' });
    }
    try {
        const result = await ledger_1.ledger.exerciseChoice(party, 'CrossBorderTx', contractId, 'Reject', { reason });
        res.json({ status: 'rejected', result });
    }
    catch (error) {
        console.error('Error rejecting transaction:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
/**
 * POST /api/transactions/:contractId/settle?party=<senderPartyId>
 * Sender settles an approved transaction.
 */
router.post('/:contractId/settle', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const result = await ledger_1.ledger.exerciseChoice(party, 'CrossBorderTx', contractId, 'Settle', {});
        res.json({ status: 'settled', result });
    }
    catch (error) {
        console.error('Error settling transaction:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
exports.default = router;
