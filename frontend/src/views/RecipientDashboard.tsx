import React from "react";
import TransactionTable from "../components/TransactionTable";
import ProposalTable from "../components/ProposalTable";
import { useProposals } from "../stores/proposalStore";
import { useTransactions } from "../stores/transactionStore";

const RecipientDashboard: React.FC = () => {
  const { proposals } = useProposals();
  const { transactions } = useTransactions();

  // Filter pending proposals
  const pendingProposals = proposals.filter(
    (p) => (p.payload as any)?.status === "Initiated"
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Recipient Dashboard</h2>

      {/* Pending Proposals Section */}
      <section className="mb-5">
        <h4 className="mb-3">
          Pending Proposals
          <span className="badge bg-warning ms-2">{pendingProposals.length}</span>
        </h4>
        {pendingProposals.length > 0 ? (
          <ProposalTable role="recipient" />
        ) : (
          <div className="alert alert-info">No pending proposals</div>
        )}
        <p className="text-muted mt-2">
          Review incoming proposals and accept if the terms are acceptable. Once accepted,
          the regulator will review for AML/KYC compliance.
        </p>
      </section>

      {/* Transactions Section */}
      <section className="mb-5">
        <h4 className="mb-3">
          My Transactions
          <span className="badge bg-primary ms-2">{transactions.length}</span>
        </h4>
        {transactions.length > 0 ? (
          <TransactionTable role="recipient" />
        ) : (
          <div className="alert alert-info">No transactions yet</div>
        )}
        <p className="text-muted mt-2">
          Once you accept a proposal, it becomes a transaction. The regulator will
          approve or reject based on compliance checks. The sender will then settle the transaction.
        </p>
      </section>

      {/* Information Box */}
      <section className="alert alert-info mt-4">
        <h6>Your Privacy in This DApp:</h6>
        <ul className="mb-0">
          <li>✓ You <strong>can see</strong> the sender's name and country</li>
          <li>✗ You <strong>cannot see</strong> the sender's account details, SWIFT code, or tax ID</li>
          <li>✗ You <strong>cannot see</strong> AML/KYC compliance data (regulator-only)</li>
          <li>✓ The regulator can see <strong>all information</strong> for compliance purposes</li>
        </ul>
      </section>
    </div>
  );
};

export default RecipientDashboard;
