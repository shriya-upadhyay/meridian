import React, { useState } from "react";
import CompliancePanel from "../components/CompliancePanel";
import TransactionTable from "../components/TransactionTable";
import { useTransactions } from "../stores/transactionStore";

const RegulatorDashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(
    transactions.length > 0 ? transactions[0].contractId : undefined
  );

  // Group transactions by status
  const pendingApproval = transactions.filter(
    (tx) => (tx.payload as any)?.status === "Initiated" || (tx.payload as any)?.status === "ComplianceCheck"
  );
  const approved = transactions.filter((tx) => (tx.payload as any)?.status === "Approved");
  const rejected = transactions.filter((tx) => (tx.payload as any)?.status === "Rejected");

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Regulator Dashboard</h2>

      {/* Overview Stats */}
      <section className="row mb-5">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Pending Review</h5>
              <h3 className="text-warning">{pendingApproval.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Approved</h5>
              <h3 className="text-success">{approved.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Rejected</h5>
              <h3 className="text-danger">{rejected.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total</h5>
              <h3 className="text-primary">{transactions.length}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Panel for Selected Transaction */}
      <section className="mb-5">
        <h4 className="mb-3">Selected Transaction Compliance Data</h4>
        {selectedTxId ? (
          <CompliancePanel transactionId={selectedTxId} />
        ) : (
          <div className="alert alert-info">No transactions to review</div>
        )}
      </section>

      {/* All Transactions Table */}
      <section className="mb-5">
        <h4 className="mb-3">All Transactions</h4>
        <div className="mb-3">
          <p className="text-muted">
            Click approve or reject to process transactions. Use the flag button to mark suspicious activities.
          </p>
        </div>
        <TransactionTable role="regulator" />
      </section>

      {/* Regulatory Information */}
      <section className="alert alert-info mt-4">
        <h6>Regulator Access & Responsibilities:</h6>
        <ul className="mb-0">
          <li>✓ You can see <strong>all information</strong> (sender & recipient details, AML/KYC data)</li>
          <li>✓ You <strong>must approve or reject</strong> each transaction for AML/KYC compliance</li>
          <li>✓ You can <strong>flag suspicious transactions</strong> with detailed notes</li>
          <li>✓ You receive <strong>full audit trail</strong> of all cross-border transactions</li>
          <li>✓ High risk scores (more than 70%) should trigger enhanced due diligence</li>
        </ul>
      </section>
    </div>
  );
};

export default RegulatorDashboard;
