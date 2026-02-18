import express from 'express';
import cors from 'cors';
import proposalsRouter from './routes/proposals';
import transactionsRouter from './routes/transactions';
import viewsRouter from './routes/views';
import { PartyInfo } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Hardcoded party list matching the parties allocated by `daml start`.
 * These names must match what the DAML script allocates.
 */
const PARTIES: PartyInfo[] = [
  { id: 'AliceCorp_Singapore', name: 'AliceCorp (Sender)', role: 'sender' },
  { id: 'BobLtd_London', name: 'BobLtd (Recipient)', role: 'recipient' },
  { id: 'MAS_Regulator', name: 'MAS Regulator', role: 'regulator' },
];

// Party list endpoint
app.get('/api/parties', (_req, res) => {
  res.json(PARTIES);
});

// Mount route modules
app.use('/api/proposals', proposalsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api', viewsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Cross-Border TX backend running on http://localhost:${PORT}`);
  console.log(`Canton JSON API expected at http://localhost:7575`);
  console.log(`Parties: ${PARTIES.map(p => p.name).join(', ')}`);
});
