# Meridian Quick Start (5 Minutes)

## Prerequisites
- ✅ DAML SDK 3.4.10 installed
- ✅ Node.js 18+ installed
- ✅ npm dependencies already installed

## Start the Application (3 Terminals)

### Terminal 1: Canton Sandbox
```bash
cd /Users/shriyaupadhyay/projects/meridian
~/.daml/bin/daml start
```
**Wait for**: `JSON API server at http://localhost:7575`

### Terminal 2: Express Backend
```bash
cd /Users/shriyaupadhyay/projects/meridian/backend
npm run dev
```
**Wait for**: `Server running on port 3000`

### Terminal 3: React Frontend
```bash
cd /Users/shriyaupadhyay/projects/meridian/frontend
npm run dev
```
**Wait for**: `VITE ... ready in ... ms`

## Open Browser
Visit: **http://localhost:5173**

## Test Workflow (5 minutes)

1. **Sender Dashboard** (Alice)
   - Fill form with amount 1000 USD
   - Click "Create Proposal"
   - ✓ Proposal appears in "My Proposals"

2. **Switch to Recipient** (Bob)
   - Select "BobLtd (Recipient)" from dropdown
   - Navigate to Recipient Dashboard
   - Click "Accept" on the proposal
   - ✓ Proposal status changes to "accepted"

3. **Switch to Regulator** (MAS)
   - Select "MAS (Regulator)" from dropdown
   - Navigate to Regulator Dashboard
   - See the pending transaction
   - Click "Approve"
   - ✓ Transaction status changes to "Approved"

4. **Back to Sender**
   - Switch to "AliceCorp (Sender)"
   - Navigate to Sender Dashboard
   - Click "Settle" on the approved transaction
   - ✓ Transaction status changes to "Settled"

## Verify Privacy (Selective Disclosure)

### As Sender (Alice):
- See your own account details ✓
- See recipient's name and country ✓
- Cannot see recipient's account number ✗
- Cannot see AML/KYC data ✗

### As Recipient (Bob):
- See your own account details ✓
- See sender's name and country ✓
- Cannot see sender's account number ✗
- Cannot see AML/KYC data ✗

### As Regulator (MAS):
- See ALL information ✓
- Full compliance data visible ✓
- Complete audit trail available ✓

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `daml: command not found` | `export PATH="$HOME/.daml/bin:$PATH"` |
| Port 7575 already in use | Kill: `lsof -i :7575 && kill -9 <PID>` |
| `npm: command not found` | Install Node.js 18+ from nodejs.org |
| Blank page in browser | Check browser console: F12 → Console tab |
| Backend not responding | Verify running: `curl http://localhost:3000/api/parties` |

## Next: Explore the Code

- **Smart Contracts**: `daml/CrossBorderTransaction.daml` (450 lines)
- **Backend API**: `backend/src/` (6 files, full routing)
- **Frontend App**: `frontend/src/` (20+ files, fully wired)
- **API Spec**: `common/openapi.yaml` (13 endpoints)

## Key Files Created in This Session

### Backend (Complete)
- ✅ `backend/src/api.ts` - HTTP client with 10+ methods
- ✅ `backend/src/stores/proposalStore.tsx` - Full API integration
- ✅ `backend/src/stores/transactionStore.tsx` - Full API integration
- ✅ `backend/src/components/ProposalForm.tsx` - 180+ lines, complete form
- ✅ `backend/src/components/ProposalTable.tsx` - Dynamic data binding
- ✅ `backend/src/components/TransactionTable.tsx` - Modal actions
- ✅ `backend/src/components/CompliancePanel.tsx` - Risk visualization
- ✅ `backend/src/views/SenderDashboard.tsx` - Full layout
- ✅ `backend/src/views/RecipientDashboard.tsx` - Full layout
- ✅ `backend/src/views/RegulatorDashboard.tsx` - Stats + compliance
- ✅ `backend/src/components/Header.tsx` - Current party display

### Documentation
- ✅ `README.md` - Comprehensive guide (200+ lines)
- ✅ `QUICKSTART.md` - This file

## Architecture Overview

```
User Browser (React)
    ↓ HTTP (port 5173)
    ↓
Vite Dev Server (proxy /api)
    ↓ HTTP (port 3000)
    ↓
Express Backend
    ↓ HTTP (port 7575)
    ↓
Canton JSON API
    ↓
Canton Sandbox (DAML Ledger)
```

## Status: ✅ COMPLETE

All features implemented and ready to run:
- ✅ Full DAML smart contracts
- ✅ Complete Express backend
- ✅ Complete React frontend
- ✅ All API endpoints
- ✅ All React components
- ✅ All state management
- ✅ Privacy & selective disclosure
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications

**No additional setup needed. Start the 3 terminals and go!**

---

For detailed documentation, see `README.md`
