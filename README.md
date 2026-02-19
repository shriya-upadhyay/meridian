# Meridian: Cross-Border Transaction DApp

A production-ready DAML-based cross-border transaction application demonstrating **selective disclosure** and **privacy-by-design** on the Canton Network.

## Overview

Meridian implements a three-party settlement workflow:

1. **Sender (Alice Corp)** - Initiates cross-border transactions
2. **Recipient (Bob Ltd)** - Accepts proposals and receives transfers
3. **Regulator (MAS)** - Reviews AML/KYC compliance and approves/rejects

**Key Features:**
- ✅ **Selective Disclosure**: Each party sees only their authorized contracts and data
- ✅ **Privacy-by-Design**: View contracts (SenderView, RecipientView, RegulatorView) limit data visibility
- ✅ **Complete Workflow**: Proposal → Acceptance → Compliance Review → Settlement
- ✅ **AML/KYC Integration**: Risk scoring, sanctions checks, PEP checks
- ✅ **Multi-Currency Support**: USD, EUR, GBP, JPY, CHF, SGD, HKD, AED
- ✅ **Full-Stack**: DAML contracts + Express backend + React frontend

## Technology Stack

- **Smart Contracts**: DAML 3.4.10 on Canton Network
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + TypeScript + Vite
- **API**: RESTful with OpenAPI 3.0 spec
- **Database**: Canton ledger (no external DB needed for dev)

## Project Structure

```
meridian/
├── daml/
│   └── CrossBorderTransaction.daml    # DAML smart contracts (5 templates)
├── backend/
│   ├── src/
│   │   ├── index.ts                   # Express server entry point
│   │   ├── ledger.ts                  # Canton JSON API client
│   │   ├── types.ts                   # TypeScript interfaces
│   │   └── routes/
│   │       ├── proposals.ts
│   │       ├── transactions.ts
│   │       └── views.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root component
│   │   ├── api.ts                     # HTTP client
│   │   ├── stores/                    # React Context stores
│   │   ├── views/                     # Dashboard pages
│   │   ├── components/                # Reusable components
│   │   └── utils/                     # Helper functions
│   ├── vite.config.ts
│   ├── index.html
│   └── package.json
├── common/
│   └── openapi.yaml                   # REST API specification
└── daml.yaml                          # DAML project config
```

## Prerequisites

1. **DAML SDK 3.4.10** - Install from [digitalasset.com](https://docs.digitalasset.com/build/3.4/getting-started/installation.html)
2. **Node.js 18+** - For backend and frontend
3. **npm 9+** - Package manager
4. **Docker** (optional) - For containerized deployment

## Quick Start (3 Terminals)

### Terminal 1: Start Canton Sandbox & JSON API

```bash
cd /Users/shriyaupadhyay/projects/meridian

# Build DAML contract (if not already built)
~/.daml/bin/daml build

# Start sandbox with JSON API on port 7575
~/.daml/bin/daml start
```

Expected output:
```
INFO: Digital Asset Developer Sandbox
INFO: JSON API server at http://localhost:7575
INFO: Loaded scenario 'setup' from script
```

### Terminal 2: Start Express Backend

```bash
cd /Users/shriyaupadhyay/projects/meridian/backend

# Install dependencies (already done, but run if needed)
npm install

# Start development server on port 3000
npm run dev
```

Expected output:
```
Server running on port 3000
```

Verify with:
```bash
curl http://localhost:3000/api/parties
```

Should return:
```json
[
  {"id": "AliceCorp_Singapore", "name": "AliceCorp (Sender)", "role": "sender"},
  {"id": "BobLtd_London", "name": "BobLtd (Recipient)", "role": "recipient"},
  {"id": "MAS_Regulator", "name": "MAS (Regulator)", "role": "regulator"}
]
```

### Terminal 3: Start React Frontend

```bash
cd /Users/shriyaupadhyay/projects/meridian/frontend

# Install dependencies (already done, but run if needed)
npm install

# Start Vite dev server on port 5173
npm run dev
```

Expected output:
```
VITE v6.x.x  ready in 234 ms

➜  Local:   http://localhost:5173/
```

Open browser and navigate to: **http://localhost:5173**

## Usage Guide

### 1. Select a Party

Use the dropdown in the header to switch between:
- **Sender (AliceCorp)** - Create and settle proposals
- **Recipient (BobLtd)** - Accept proposals
- **Regulator (MAS)** - Approve/reject and flag suspicious transactions

### 2. Sender Flow

1. Navigate to **Sender Dashboard**
2. Fill in the **Create New Proposal** form:
   - Recipient: BobLtd
   - Amount: 1000
   - Currency: USD
   - Sender details (your info)
   - Recipient details (their info)
   - Compliance data (purpose, risk score, etc.)
3. Click **Create Proposal**
4. Proposal appears in "My Proposals" with "Pending" status
5. Wait for recipient to accept and regulator to approve
6. Once approved, click **Settle** to complete

### 3. Recipient Flow

1. Navigate to **Recipient Dashboard**
2. See pending proposals in "Pending Proposals" section
3. Review proposal details
4. Click **Accept** to accept the proposal
5. Proposal becomes a transaction awaiting regulator approval
6. Monitor transaction status in "My Transactions"

### 4. Regulator Flow

1. Navigate to **Regulator Dashboard**
2. See overview statistics (Pending, Approved, Rejected, Total)
3. Click on a transaction to view **Compliance Data**:
   - Sender & recipient information
   - AML/KYC checks (sanctions, PEP)
   - Risk score visualization
   - Source of funds and payment purpose
4. Review and decide:
   - **Approve** - Transaction can proceed to settlement
   - **Reject** - Reject with detailed reason
   - **Flag** - Mark as suspicious with investigation notes
5. All actions are audited and recorded

## Privacy & Selective Disclosure

Meridian demonstrates **selective disclosure** using DAML's contract model:

### Sender Sees:
✅ Own full details (account, SWIFT, tax ID)
✅ Recipient's name and country
✗ Recipient's account, SWIFT, tax ID
✗ AML/KYC compliance data

### Recipient Sees:
✅ Own full details (account, SWIFT, tax ID)
✅ Sender's name and country
✗ Sender's account, SWIFT, tax ID
✗ AML/KYC compliance data

### Regulator Sees:
✅ **Everything** - Full audit trail, all party details, compliance data
✓ This is intentional - regulators need complete visibility

## API Endpoints

### Parties
- `GET /api/parties` - List available parties

### Proposals
- `GET /api/proposals?party=X` - List proposals visible to party
- `POST /api/proposals?party=X` - Create new proposal
- `POST /api/proposals/{id}/accept?party=X` - Accept proposal
- `POST /api/proposals/{id}/withdraw?party=X` - Withdraw proposal

### Transactions
- `GET /api/transactions?party=X` - List transactions
- `POST /api/transactions/{id}/approve?party=X` - Approve transaction
- `POST /api/transactions/{id}/reject?party=X` - Reject transaction
- `POST /api/transactions/{id}/settle?party=X` - Settle transaction

### Views (Privacy Contracts)
- `GET /api/sender-views?party=X` - List sender views
- `GET /api/recipient-views?party=X` - List recipient views
- `GET /api/regulator-views?party=X` - List regulator views
- `POST /api/regulator-views/{id}/flag?party=X` - Flag suspicious

See `common/openapi.yaml` for full API specification.

## DAML Smart Contracts

The DAML contract (`daml/CrossBorderTransaction.daml`) implements:

### Templates

1. **CrossBorderTxProposal**
   - Signatories: Sender, Regulator
   - Observers: Recipient
   - Choices: `AcceptProposal`, `WithdrawProposal`

2. **CrossBorderTx** (Main Contract)
   - Signatories: Sender
   - Observers: Recipient, Regulator
   - Choices: `Approve`, `Reject`, `Settle`, `RequestCancellation`

3. **SenderView** (Privacy View)
   - Visible to: Sender, Regulator
   - Contains: Sender's full details, recipient name/country only

4. **RecipientView** (Privacy View)
   - Visible to: Recipient, Regulator
   - Contains: Recipient's full details, sender name/country only

5. **RegulatorView** (Privacy View)
   - Visible to: Regulator only
   - Contains: **All** information for compliance purposes

### Data Types

- **Currency**: USD, EUR, GBP, JPY, CHF, SGD, HKD, AED
- **TxStatus**: Initiated, ComplianceCheck, Approved, Rejected, Settled, Cancelled
- **SenderDetails**: Name, account, SWIFT, country, tax ID
- **RecipientDetails**: Name, account, SWIFT, country, tax ID
- **ComplianceData**: Purpose, source of funds, risk score, sanctions/PEP checks, AML notes
- **FxRate**: Exchange rate, timestamp, provider

## Troubleshooting

### Issue: "daml command not found"
**Solution**: Add daml to PATH
```bash
export PATH="$HOME/.daml/bin:$PATH"
# Add to ~/.zshrc or ~/.bash_profile to make permanent
```

### Issue: "Cannot GET /api/parties"
**Solution**: Ensure backend is running on port 3000
```bash
cd backend && npm run dev
```

### Issue: "Failed to connect to ledger"
**Solution**: Ensure Canton sandbox is running
```bash
~/.daml/bin/daml start
```

### Issue: Port 5173/3000/7575 already in use
**Solution**: Kill existing process
```bash
lsof -i :5173  # Find process using port
kill -9 <PID>   # Kill process
```

## Development

### Backend Development

The backend is hot-reloaded with `tsx`:
```bash
cd backend
npm run dev  # Watches for file changes
```

### Frontend Development

Vite provides hot module reloading:
```bash
cd frontend
npm run dev  # Auto-reloads on file changes
```

### Building for Production

```bash
# Build DAML
cd meridian
~/.daml/bin/daml build

# Build backend (TypeScript → JavaScript)
cd backend
npm run build

# Build frontend (React → static HTML/JS)
cd frontend
npm run build
```

## Testing

### Run DAML Tests
```bash
cd /Users/shriyaupadhyay/projects/meridian
~/.daml/bin/daml test --verbose
```

### Manual Integration Test
1. Create proposal (Sender)
2. Accept proposal (Recipient)
3. Approve transaction (Regulator)
4. Settle transaction (Sender)
5. Verify all party views updated correctly

## Architecture Decisions

1. **No External Database** - Canton ledger serves as the source of truth
2. **Fetch-based API Client** - Simple, no heavy dependencies
3. **React Context for State** - Easy to understand, no Redux boilerplate
4. **View Contracts for Privacy** - DAML native privacy, no application-layer hacks
5. **OpenAPI Spec** - Single source of truth for API contracts

## Security Considerations

⚠️ **This is a development application.** For production:

1. **Authentication** - Replace party display names with OAuth/JWT
2. **TLS/SSL** - Use HTTPS in production
3. **Rate Limiting** - Add request throttling
4. **Audit Logging** - Log all regulatory actions
5. **Encryption** - Encrypt sensitive data at rest
6. **PII Compliance** - Handle GDPR/CCPA requirements

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review logs in Canton sandbox output
3. Check browser console for frontend errors
4. Verify API calls with `curl` before debugging frontend

## Next Steps

1. ✅ Deploy to Canton testnet
2. ✅ Add real bank integration (SWIFT, account lookup)
3. ✅ Implement real AML/KYC screening (Dow Jones, Lexis Nexis)
4. ✅ Add regulatory reporting (FinCEN, FATF)
5. ✅ Multi-currency settlement with FX rates
6. ✅ Mobile app for party notifications

---

**Happy transacting! 🚀**
