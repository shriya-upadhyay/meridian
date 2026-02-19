import React from "react";
import ProposalForm from "../components/ProposalForm";
import ProposalTable from "../components/ProposalTable";
import TransactionTable from "../components/TransactionTable";
import { useProposals } from "../stores/proposalStore";
import { useTransactions } from "../stores/transactionStore";

const SenderDashboard: React.FC = () => {
  const { proposals } = useProposals();
  const { transactions } = useTransactions();

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sender Dashboard</h2>

      {/* Create New Proposal Section */}
      <section className="mb-5">
        <ProposalForm />
      </section>

      {/* Proposals Section */}
      <section className="mb-5">
        <h4 className="mb-3">
          My Proposals
          <span className="badge bg-primary ms-2">{proposals.length}</span>
        </h4>
        <ProposalTable role="sender" />
      </section>

      {/* Transactions Section */}
      <section className="mb-5">
        <h4 className="mb-3">
          My Transactions
          <span className="badge bg-primary ms-2">{transactions.length}</span>
        </h4>
        <TransactionTable role="sender" />
        <p className="text-muted mt-2">
          Once a proposal is accepted by the recipient and approved by the regulator, you can settle the transaction.
        </p>
      </section>

      {/* Status Legend */}
      <section className="alert alert-info mt-4">
        <h6>Transaction Status Legend:</h6>
        <ul className="mb-0">
          <li><span className="badge bg-secondary">Initiated</span> - Proposal created, awaiting recipient acceptance</li>
          <li><span className="badge bg-warning text-dark">ComplianceCheck</span> - Regulator is reviewing for AML/KYC</li>
          <li><span className="badge bg-primary">Approved</span> - Regulator approved, ready to settle</li>
          <li><span className="badge bg-danger">Rejected</span> - Regulator rejected the transaction</li>
          <li><span className="badge bg-success">Settled</span> - Transaction completed</li>
        </ul>
      </section>
    </div>
  );
};

export default SenderDashboard;
