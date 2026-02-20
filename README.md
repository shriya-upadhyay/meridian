# Meridian

**Private multi-party transactions on Canton Network.**

Meridian is a cross-border settlement application that demonstrates how multiple parties can transact on a shared ledger while each seeing only the data they're authorized to see. Built with DAML smart contracts on Canton L1, it uses Canton's sub-transaction privacy to enforce data visibility at the ledger level — not through application-layer access control.

## The Problem

Cross-border transactions above certain thresholds are **legally required** to undergo regulatory screening. In the US, banks must file Currency Transaction Reports (CTRs) for transfers over $10,000. The EU's Anti-Money Laundering Directives require enhanced due diligence for high-value transactions. SWIFT's correspondent banking network processes over $5 trillion daily — and every one of those transfers passes through compliance checks.

This isn't optional. It's the law. And yet, existing systems force a painful tradeoff:

**Public blockchains** (Ethereum, Solana) give you a shared ledger with smart contracts, but every participant — and every validator, indexer, and chain analyst — can see every transaction. This makes them unusable for any scenario where transaction details are sensitive: business payments, medical records, supply chain pricing, legal settlements.

**Fully private systems** (Tornado Cash, Zcash) solve the privacy problem but create a compliance problem. Regulators can't audit what they can't see. This is why privacy-focused crypto faces regulatory pushback worldwide.

**Traditional systems** (SWIFT, internal databases) are private and compliant, but siloed. Each party maintains their own records, reconciliation takes days, and there's no shared source of truth.

The result: organizations that need both privacy AND auditability — banks, hospitals, supply chains, legal firms, aid organizations — are stuck with slow, fragmented systems because no blockchain has been able to offer both.

## How Meridian Solves It

Most blockchains work like a public bulletin board — when you post a transaction, everyone can read it. Canton Network works differently. It only sends transaction data to the parties who are directly involved. If you're not part of the transaction, the data never reaches your node. It's not encrypted or hidden — it simply isn't sent to you.

Meridian builds on top of this with three design choices that go beyond Canton's built-in privacy:

### 1. View Contract Fan-Out

When a recipient accepts a proposal, Meridian doesn't just create one contract. It creates **four contracts simultaneously**, each scoped to different parties:

- `CrossBorderTx` — shared summary visible to all three parties (no sensitive details)
- `SenderView` — sender's full bank details, visible only to sender + regulator
- `RecipientView` — recipient's full bank details, visible only to recipient + regulator
- `RegulatorView` — everything combined, visible only to the regulator

This fan-out pattern is a reusable architecture for any multi-party workflow where different roles need different levels of access.

### 2. Data Provenance

Each piece of data enters the system from the party who actually owns it:

- The **sender** provides their own bank details and a compliance declaration
- The **recipient** provides their own bank details at acceptance time — the sender never handles them
- The **compliance screening** (risk score, sanctions check, PEP flag) is produced by the regulator's automated service — neither party self-reports their own risk

This means no party can fabricate or tamper with another party's data. The system design enforces data integrity, not just data privacy.

### 3. Post-Settlement Regulatory Oversight

Just like in real correspondent banking, transactions aren't pre-approved by regulators — they flow through, and regulators monitor after the fact. The regulator has active tools:

- **Freeze** — halt a suspicious transaction before the sender can settle it
- **Flag** — mark a transaction as suspicious with investigation notes on the RegulatorView

The compliance data (risk score, sanctions/PEP checks) is computed automatically at acceptance time and presented to the regulator for monitoring. Neither the sender nor the recipient ever sees this data — they don't know their own risk score or what the regulator's notes say about them.

### The Result

This gives you all three properties that were previously impossible to combine: **verifiability** (shared ledger with smart contracts), **privacy** (each party sees only their slice), and **compliance** (regulator gets full audit trail with freeze/flag capabilities).

## Privacy Model: Who Sees What

This is the core of what Meridian demonstrates. For any given transaction, here is exactly what each party can and cannot see:

| Data Field                 | Sender (AliceCorp) | Recipient (BobLtd) | Regulator (MAS) | Uninvolved Party |
|:---------------------------|:------------------:|:------------------:|:---------------:|:----------------:|
| Transaction exists         | Visible            | Visible            | Visible         | **Hidden**       |
| Amount & currency          | Visible            | Visible            | Visible         | **Hidden**       |
| FX rate                    | Visible            | Visible            | Visible         | **Hidden**       |
| Transaction status         | Visible            | Visible            | Visible         | **Hidden**       |
| Sender name & country      | Visible            | Visible            | Visible         | **Hidden**       |
| Recipient name & country   | Visible            | Visible            | Visible         | **Hidden**       |
| Sender account & SWIFT     | Visible            | **Hidden**         | Visible         | **Hidden**       |
| Sender tax ID              | Visible            | **Hidden**         | Visible         | **Hidden**       |
| Recipient account & SWIFT  | **Hidden**         | Visible            | Visible         | **Hidden**       |
| Recipient tax ID           | **Hidden**         | Visible            | Visible         | **Hidden**       |
| Purpose of payment         | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |
| Source of funds             | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |
| AML risk score             | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |
| Sanctions check            | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |
| PEP check                  | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |
| AML notes                  | **Hidden**         | **Hidden**         | Visible         | **Hidden**       |

**How this is enforced**: Each row maps to a field on a specific DAML contract template. The contract's `signatory` and `observer` declarations determine which parties can see it. Canton's ledger only delivers contract data to stakeholders — there is no API endpoint, database query, or network request that an uninvolved party could use to access this data. It is never sent to them.

## Beyond Cross-Border Payments

The privacy pattern Meridian demonstrates — **multiple parties transact, an auditor gets full visibility, everyone else sees nothing** — applies to any multi-party workflow where data sensitivity matters:

- **Supply chain finance** — A manufacturer pays a supplier. The logistics provider sees shipment status but not the price. Customs sees everything for trade compliance. Competitors on the same network see nothing.
- **Healthcare** — A patient shares records with a specialist. Insurance can verify the claim without seeing the diagnosis. A fraud auditor can review everything. Other patients' data is invisible.
- **Legal settlements** — Two parties settle a dispute. The court has full visibility. Opposing counsel in unrelated cases cannot see the terms.
- **Aid disbursement** — A donor funds a humanitarian project. The implementing NGO sees their allocation. The oversight body sees all fund flows. Other donors' contributions remain private.

The DAML contract pattern (signatory/observer-based view contracts) is the same in each case. Meridian's cross-border payment is one instantiation of a general-purpose privacy model.

## Transaction Lifecycle

```
1. Sender creates       2. Recipient accepts      3. Sender settles        Regulator monitors
   proposal                (view contracts            (payment               (can freeze or flag
                            fan out, auto-approved)    finalized)              at any time)
```

**Step 1 — Proposal**: AliceCorp submits a settlement proposal containing:
- Their own bank details (account number, SWIFT code, tax ID)
- The recipient's bank details
- A compliance declaration (purpose of payment, source of funds)

**Step 2 — Acceptance**: BobLtd reviews the proposal and accepts. At acceptance time:
- The compliance service automatically screens the transaction (risk score, sanctions check, PEP check) — produced by the regulator's system, not self-reported by either party
- The system creates four view contracts, each with different visibility
- Transaction status moves directly to `Approved` — no regulator gate required

Neither party sees the compliance results.

**Step 3 — Settlement**: AliceCorp settles the transaction. Status moves to `Settled`.

**Ongoing — Regulatory Monitoring**: MAS sees the `RegulatorView` contract — the only contract containing everything: both parties' full bank details, the sender's declaration, and the compliance screening results. Neither AliceCorp nor BobLtd can see this contract. MAS can **freeze** suspicious transactions (preventing settlement) or **flag** them with investigation notes.

## Setup & Installation

### Prerequisites

- **DAML SDK 3.4.10**: `curl -sSL https://get.daml.com/ | sh` then add `~/.daml/bin` to your PATH
- **Node.js 18+**: [nodejs.org](https://nodejs.org/)

### Running Locally (3 terminals)

**Terminal 1 — Start Canton sandbox + compile contracts:**
```bash
cd meridian
daml build && daml start
```
This starts a local Canton ledger with the JSON API on `localhost:7575`.

**Terminal 2 — Start the backend:**
```bash
cd meridian/backend
npm install && npm run dev
```
Express API server on `localhost:3000`.

**Terminal 3 — Start the frontend:**
```bash
cd meridian/frontend
npm install && npm run dev
```
React app on `localhost:5173`. Open this in your browser.

### Verify

```bash
curl http://localhost:3000/api/parties
```

Should return:
```json
[
  {"id": "AliceCorp_Singapore", "name": "AliceCorp (Sender)", "role": "sender"},
  {"id": "BobLtd_London", "name": "BobLtd (Recipient)", "role": "recipient"},
  {"id": "MAS_Regulator", "name": "MAS Regulator", "role": "regulator"}
]
```

## Demo Walkthrough

1. Open `http://localhost:5173`. You start as **AliceCorp (Sender)**.
2. Fill in the proposal form and click **Create Proposal**.
3. Use the party selector dropdown to switch to **BobLtd (Recipient)**.
4. You'll see the incoming proposal. Click **Accept**. The transaction is now auto-approved.
5. Switch to **MAS (Regulator)**. You now see full compliance data — risk score, sanctions status, PEP check, source of funds — that neither AliceCorp nor BobLtd can see. You can **freeze** or **flag** suspicious transactions.
6. Switch back to **AliceCorp**. Click **Settle** to finalize the transaction.

At each step, notice what data is visible and what is hidden. This is Canton's privacy model in action.

## Architecture

```
React Frontend (Vite, :5173)
  │
  │  HTTP
  ▼
Express Backend (:3000)
  ├── routes/proposals.ts      Create, accept, withdraw
  ├── routes/transactions.ts   Freeze, settle
  ├── routes/views.ts          Query per-party view contracts
  ├── complianceService.ts     AML/KYC risk screening
  └── ledger.ts                Canton JSON API v2 client
        │
        │  HTTP
        ▼
Canton JSON API (:7575)
        │
        ▼
Canton Ledger (DAML smart contracts)
```

### DAML Smart Contracts

Five templates in `daml/CrossBorderTransaction.daml`:

| Template                  | Signatories       | Observers            | Purpose                                                    |
|:--------------------------|:------------------|:---------------------|:-----------------------------------------------------------|
| `CrossBorderTxProposal`   | Sender, Regulator | Recipient            | Entry point — proposal before acceptance                   |
| `CrossBorderTx`           | Sender            | Recipient, Regulator | Orchestrating contract with shared non-sensitive fields    |
| `SenderView`              | Sender            | Regulator            | Sender's full details (account, SWIFT, tax ID)             |
| `RecipientView`           | Recipient         | Regulator            | Recipient's full details (account, SWIFT, tax ID)          |
| `RegulatorView`           | Regulator         | —                    | Everything: both parties' details + AML/KYC compliance data|

**Signatories** have full read/write access and always see the contract. **Observers** have read-only visibility. Parties not listed as either **cannot see the contract at all**.

### Tech Stack

| Layer           | Technology                     |
|:----------------|:-------------------------------|
| Smart Contracts | DAML 3.4.10                    |
| Ledger          | Canton Network (L1)            |
| Backend         | Node.js, Express, TypeScript   |
| Frontend        | React 18, Vite, TypeScript     |
| State           | Canton Ledger (no external DB) |

## API Reference

All endpoints require `?party=<PARTY_ID>` query parameter.

| Method | Endpoint                                | Description                      |
|:-------|:----------------------------------------|:---------------------------------|
| `GET`  | `/api/parties`                          | List parties                     |
| `GET`  | `/api/proposals?party=X`                | List proposals visible to party  |
| `POST` | `/api/proposals?party=X`                | Create proposal                  |
| `POST` | `/api/proposals/{id}/accept?party=X`    | Accept proposal                  |
| `POST` | `/api/proposals/{id}/withdraw?party=X`  | Withdraw proposal                |
| `GET`  | `/api/transactions?party=X`             | List transactions                |
| `POST` | `/api/transactions/{id}/freeze?party=X` | Freeze (regulator)               |
| `POST` | `/api/transactions/{id}/settle?party=X` | Settle (sender)                  |
| `GET`  | `/api/sender-views?party=X`             | Query sender view contracts      |
| `GET`  | `/api/recipient-views?party=X`          | Query recipient view contracts   |
| `GET`  | `/api/regulator-views?party=X`          | Query regulator view contracts   |

Full spec: [`common/openapi.yaml`](common/openapi.yaml)

## Project Structure

```
meridian/
├── daml/
│   └── CrossBorderTransaction.daml   # 5 DAML templates + test script
├── backend/
│   └── src/
│       ├── index.ts                  # Express server, party definitions
│       ├── ledger.ts                 # Canton JSON API v2 client
│       ├── complianceService.ts      # AML/KYC risk screening
│       ├── types.ts                  # TypeScript interfaces
│       └── routes/                   # REST endpoints
├── frontend/
│   └── src/
│       ├── App.tsx                   # Router
│       ├── api.ts                    # HTTP client
│       ├── stores/                   # React Context state management
│       ├── views/                    # Per-party dashboard pages
│       └── components/               # Forms, tables, compliance panel
├── common/
│   └── openapi.yaml                  # OpenAPI 3.0 specification
└── daml.yaml                         # DAML SDK config
```

---

Built for the Canton Network Hackathon at ETH Denver 2026.
