import React, { useState, useEffect } from "react";
import CompliancePanel from "../components/CompliancePanel";
import TransactionTable from "../components/TransactionTable";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";

const RegulatorDashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const { parties, currentParty, setCurrentParty } = usePartyStore();

  // Auto-switch to regulator party when navigating to this dashboard
  useEffect(() => {
    const regulatorParty = parties.find(p => p.role === 'regulator');
    if (regulatorParty && currentParty?.id !== regulatorParty.id) {
      setCurrentParty(regulatorParty);
    }
  }, [parties]);

  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(
    transactions.length > 0 ? transactions[0].contractId : undefined
  );

  // Group transactions by status
  const active = transactions.filter((tx) => (tx.payload as any)?.status === "Approved");
  const settled = transactions.filter((tx) => (tx.payload as any)?.status === "Settled");
  const frozen = transactions.filter((tx) => (tx.payload as any)?.status === "Frozen");

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Regulator Dashboard</h2>

      {/* Overview Stats */}
      <section className="row mb-5 g-3">
        <div className="col-md-3">
          <div className="card stat-card stat-active">
            <div className="card-body">
              <div className="stat-label">Active</div>
              <div className="stat-value">{active.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card stat-settled">
            <div className="card-body">
              <div className="stat-label">Settled</div>
              <div className="stat-value">{settled.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card stat-frozen">
            <div className="card-body">
              <div className="stat-label">Frozen</div>
              <div className="stat-value">{frozen.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card stat-total">
            <div className="card-body">
              <div className="stat-label">Total</div>
              <div className="stat-value">{transactions.length}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Panel for Selected Transaction */}
      <section className="mb-5">
        <h4 className="mb-3">Compliance Data</h4>
        {selectedTxId ? (
          <CompliancePanel transactionId={selectedTxId} />
        ) : (
          <div className="alert alert-info">Click a transaction below to view compliance details</div>
        )}
      </section>

      {/* All Transactions Table */}
      <section className="mb-5">
        <h4 className="mb-3">All Transactions</h4>
        <p className="text-muted mb-3">
          Click a contract ID to view compliance details. Use Freeze to halt suspicious transactions before settlement.
        </p>
        <TransactionTable
          role="regulator"
          onSelectTransaction={setSelectedTxId}
          selectedTransactionId={selectedTxId}
        />
      </section>

      {/* Regulatory Information */}
      <section className="alert alert-info mt-4">
        <h6>Regulator Access & Responsibilities</h6>
        <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
          <li>Full visibility into <strong>all party information</strong> (sender & recipient details, AML/KYC data)</li>
          <li><strong>Freeze</strong> suspicious transactions before they are settled</li>
          <li><strong>Flag</strong> transactions with detailed compliance notes</li>
          <li>Complete <strong>audit trail</strong> of all cross-border transactions</li>
          <li>Risk scores over 70% should trigger enhanced due diligence</li>
        </ul>
      </section>
    </div>
  );
};

export default RegulatorDashboard;
