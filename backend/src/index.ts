import express from 'express';
import cors from 'cors';
import proposalsRouter from './routes/proposals';
import transactionsRouter from './routes/transactions';
import viewsRouter from './routes/views';
import { PartyInfo } from './types';
import { ledger } from './ledger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Party definitions. The actual full IDs are resolved at startup
 * when we allocate them on the Canton sandbox.
 */
const PARTY_DEFS = [
  { hint: 'AliceCorp_Singapore', display: 'AliceCorp (Sender)', role: 'sender' as const },
  { hint: 'BobLtd_London', display: 'BobLtd (Recipient)', role: 'recipient' as const },
  { hint: 'MAS_Regulator', display: 'MAS Regulator', role: 'regulator' as const },
];

let PARTIES: PartyInfo[] = [];

/**
 * Allocate parties and create users on the Canton sandbox.
 * This must run before accepting API requests.
 */
async function initializeLedger(): Promise<void> {
  console.log('Initializing ledger connection...');

  for (const def of PARTY_DEFS) {
    try {
      const fullId = await ledger.allocateParty(def.hint, def.display);
      await ledger.createUserWithRights(def.hint, fullId);
    } catch (error: any) {
  console.error(`Failed to set up party "${def.hint}":`, error);
}
  }

  // Build party list with full IDs
  const partyMap = ledger.getPartyMap();
  PARTIES = PARTY_DEFS.map(def => ({
  id: partyMap[def.hint],   // ✅ use FULL party ID
  name: def.display,
  role: def.role,
  }));
  console.log('Ledger initialized. Party map:');
  for (const [hint, fullId] of Object.entries(partyMap)) {
    console.log(`  ${hint} → ${fullId}`);
  }
}

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

// Start server after ledger initialization
async function main() {
  try {
    await initializeLedger();
  } catch (error: any) {
    console.error('Warning: Ledger initialization failed:', error.message);
    console.error('Server will start but ledger operations may fail.');
  }

  const server = app.listen(PORT, () => {
    console.log(`\nMeridian backend running on http://localhost:${PORT}`);
    console.log(`Canton JSON API at http://localhost:7575`);
    console.log(`Parties: ${PARTIES.map(p => p.name).join(', ')}`);
  });

  // ✅ Graceful shutdown handler
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');

    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

main();
