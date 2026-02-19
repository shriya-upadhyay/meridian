"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ledger_1 = require("../ledger");
const identityService_1 = require("../identityService");
const router = (0, express_1.Router)();
/**
 * GET /api/proposals?party=<partyId>
 * List all CrossBorderTxProposal contracts visible to the party.
 */
router.get('/', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const contracts = await ledger_1.ledger.queryContracts(party, 'CrossBorderTxProposal');
        res.json(contracts);
    }
    catch (error) {
        console.error('Error listing proposals:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/proposals?party=<senderPartyId>
 * Create a new CrossBorderTxProposal.
 * Both sender and regulator must sign, so we pass both as actAs parties.
 */
router.post('/', async (req, res) => {
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    const data = req.body;
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
            compliance: data.compliance,
            amount: data.amount,
            currency: data.currency,
            createdAt: now,
        };
        // Both sender and regulator must sign the proposal
        const result = await ledger_1.ledger.createContract([party, data.regulator], 'CrossBorderTxProposal', payload);
        res.status(201).json({ status: 'created', result });
    }
    catch (error) {
        console.error('Error creating proposal:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
/**
 * POST /api/proposals/:contractId/accept?party=<recipientPartyId>
 * Recipient accepts a proposal, creating the fan-out view contracts.
 *
 * The backend auto-resolves the recipient's full bank details from the
 * BIC code stored on the proposal contract (via the identity service).
 * The recipient just clicks "Accept" — no form input needed.
 */
router.post('/:contractId/accept', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        // Step 1: Query the proposal to get the BIC code
        const proposals = await ledger_1.ledger.queryContracts(party, 'CrossBorderTxProposal');
        const proposal = proposals.find((p) => p.contractId === contractId);
        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }
        const bic = proposal.payload?.recipientBic;
        if (!bic) {
            return res.status(400).json({ error: 'No BIC code found on proposal' });
        }
        // Step 2: Resolve full recipient details from BIC (off-chain identity service)
        const recipientInfo = (0, identityService_1.resolveByBic)(bic);
        if (!recipientInfo) {
            return res.status(400).json({ error: `Unknown BIC code: ${bic}. Cannot resolve recipient details.` });
        }
        // Step 3: Exercise AcceptProposal with the resolved recipient details
        const result = await ledger_1.ledger.exerciseChoice(party, 'CrossBorderTxProposal', contractId, 'AcceptProposal', { recipientInfo });
        // The result contains a 4-tuple: (txCid, senderViewCid, recipientViewCid, regulatorViewCid)
        const exerciseResult = result?.result?.exercise_result || result?.exercise_result || result;
        res.json({
            status: 'accepted',
            txCid: exerciseResult?.[0],
            senderViewCid: exerciseResult?.[1],
            recipientViewCid: exerciseResult?.[2],
            regulatorViewCid: exerciseResult?.[3],
            raw: result,
        });
    }
    catch (error) {
        console.error('Error accepting proposal:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
/**
 * POST /api/proposals/:contractId/withdraw?party=<senderPartyId>
 * Sender withdraws a proposal.
 */
router.post('/:contractId/withdraw', async (req, res) => {
    const { contractId } = req.params;
    const party = req.query.party;
    if (!party)
        return res.status(400).json({ error: 'party query param required' });
    try {
        const result = await ledger_1.ledger.exerciseChoice(party, 'CrossBorderTxProposal', contractId, 'WithdrawProposal', {});
        res.json({ status: 'withdrawn', result });
    }
    catch (error) {
        console.error('Error withdrawing proposal:', error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data || error.message });
    }
});
exports.default = router;
