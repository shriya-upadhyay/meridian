import React, { useEffect } from "react";
import ProposalForm from "../components/ProposalForm";
import ProposalTable from "../components/ProposalTable";
import TransactionTable from "../components/TransactionTable";
import { useProposals } from "../stores/proposalStore";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";

const SenderDashboard: React.FC = () => {
  const { proposals } = useProposals();
  const { transactions } = useTransactions();
  const { parties, currentParty, setCurrentParty } = usePartyStore();

  // Auto-switch to sender party when navigating to this dashboard
  useEffect(() => {
    const senderParty = parties.find(p => p.role === 'sender');
    if (senderParty && currentParty?.id !== senderParty.id) {
      setCurrentParty(senderParty);
    }
  }, [parties]);

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
          Once a proposal is accepted by the recipient, you can settle the transaction immediately.
        </p>
      </section>

      {/* Status Legend */}
      <section className="alert alert-info mt-4">
        <h6>Transaction Status Legend</h6>
        <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
          <li><span className="badge bg-primary">Approved</span> Ready for settlement (recipient accepted)</li>
          <li><span className="badge bg-success">Settled</span> Transaction completed</li>
          <li><span className="badge bg-danger">Frozen</span> Regulator froze the transaction</li>
        </ul>
      </section>
    </div>
  );
};

export default SenderDashboard;
