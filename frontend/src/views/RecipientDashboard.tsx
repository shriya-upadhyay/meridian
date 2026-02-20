import React, { useEffect } from "react";
import TransactionTable from "../components/TransactionTable";
import ProposalTable from "../components/ProposalTable";
import { useProposals } from "../stores/proposalStore";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";

const RecipientDashboard: React.FC = () => {
  const { proposals } = useProposals();
  const { transactions } = useTransactions();
  const { parties, currentParty, setCurrentParty } = usePartyStore();

  // Auto-switch to recipient party when navigating to this dashboard
  useEffect(() => {
    const recipientParty = parties.find(p => p.role === 'recipient');
    if (recipientParty && currentParty?.id !== recipientParty.id) {
      setCurrentParty(recipientParty);
    }
  }, [parties]);


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Recipient Dashboard</h2>

      {/* Pending Proposals Section */}
      <section className="mb-5">
        <h4 className="mb-3">
          Pending Proposals
          <span className="badge bg-warning ms-2">{proposals.length}</span>
        </h4>
        {proposals.length > 0 ? (
          <ProposalTable role="recipient" />
        ) : (
          <div className="alert alert-info">No pending proposals</div>
        )}
        <p className="text-muted mt-2">
          Review incoming proposals and accept if the terms are acceptable. Once accepted,
          the sender can settle the transaction.
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
          Once you accept a proposal, it becomes a transaction. The sender can then settle it.
          The regulator monitors all transactions and can freeze suspicious ones.
        </p>
      </section>

      {/* Information Box */}
      <section className="alert alert-info mt-4">
        <h6>Your Privacy on Meridian</h6>
        <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
          <li>You <strong>can see</strong> the sender's name and country</li>
          <li>You <strong>cannot see</strong> the sender's account details, SWIFT code, or tax ID</li>
          <li>You <strong>cannot see</strong> AML/KYC compliance data (regulator-only)</li>
          <li>The regulator can see <strong>all information</strong> for compliance purposes</li>
        </ul>
      </section>
    </div>
  );
};

export default RecipientDashboard;
