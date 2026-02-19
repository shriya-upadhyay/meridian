"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const proposals_1 = __importDefault(require("./routes/proposals"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const views_1 = __importDefault(require("./routes/views"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
/**
 * Hardcoded party list matching the parties allocated by `daml start`.
 * These names must match what the DAML script allocates.
 */
const PARTIES = [
    { id: 'AliceCorp_Singapore', name: 'AliceCorp (Sender)', role: 'sender' },
    { id: 'BobLtd_London', name: 'BobLtd (Recipient)', role: 'recipient' },
    { id: 'MAS_Regulator', name: 'MAS Regulator', role: 'regulator' },
];
// Party list endpoint
app.get('/api/parties', (_req, res) => {
    res.json(PARTIES);
});
// Mount route modules
app.use('/api/proposals', proposals_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api', views_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Cross-Border TX backend running on http://localhost:${PORT}`);
    console.log(`Canton JSON API expected at http://localhost:7575`);
    console.log(`Parties: ${PARTIES.map(p => p.name).join(', ')}`);
});
