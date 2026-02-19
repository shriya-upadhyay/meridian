import React, { useState } from "react";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";
import Modal from "./Modal";

interface CompliancePanelProps {
  transactionId?: string;
}

const CompliancePanel: React.FC<CompliancePanelProps> = ({ transactionId }) => {
  const { transactions } = useTransactions();
  const { currentParty } = usePartyStore();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagNotes, setFlagNotes] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);

  // Find the transaction to display
  const transaction = transactionId
    ? transactions.find((tx) => tx.contractId === transactionId)
    : transactions[0];

  if (!transaction) {
    return <div className="alert alert-warning">No transaction data available</div>;
  }

  const payload = transaction.payload as any;

  // The RegulatorView has both declaration (sender-provided) and screening (regulator-produced)
  const declaration = payload?.declaration || {};
  const screening = payload?.screening || {};
  const sender = payload?.senderInfo || {};
  const recipient = payload?.recipientInfo || {};

  const riskColor =
    screening.riskScore > 70
      ? "danger"
      : screening.riskScore > 40
      ? "warning"
      : "success";

  const handleFlagClick = () => {
    setFlagNotes("");
    setFlagModalOpen(true);
  };

  const handleFlagSubmit = async () => {
    setFlagLoading(true);
    try {
      // TODO: Implement API call to flag suspicious transaction
      // await api.flagSuspicious(currentParty?.id, transaction.contractId, { notes: flagNotes });
      setFlagModalOpen(false);
      setFlagNotes("");
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <>
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Compliance & AML/KYC Data</h5>
        </div>
        <div className="card-body">
          {/* Party Information */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h6 className="text-secondary">Sender Information</h6>
              <p>
                <strong>Name:</strong> {sender.senderName || "N/A"}
              </p>
              <p>
                <strong>Country:</strong> {sender.senderCountry || "N/A"}
              </p>
              <p>
                <strong>Tax ID:</strong> {sender.senderTaxId || "N/A"}
              </p>
            </div>
            <div className="col-md-6">
              <h6 className="text-secondary">Recipient Information</h6>
              <p>
                <strong>Name:</strong> {recipient.recipientName || "N/A"}
              </p>
              <p>
                <strong>Country:</strong> {recipient.recipientCountry || "N/A"}
              </p>
              <p>
                <strong>Tax ID:</strong> {recipient.recipientTaxId || "N/A"}
              </p>
            </div>
          </div>

          <hr />

          {/* Sender Declaration (what the sender provided) */}
          <div className="mb-4">
            <h6 className="text-secondary mb-3">Sender Declaration</h6>
            <div className="alert alert-light py-2 mb-2">
              <small className="text-muted">Declared by the sender at proposal creation</small>
            </div>
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Purpose of Payment:</strong> {declaration.purposeOfPayment || "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Source of Funds:</strong> {declaration.sourceOfFunds || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <hr />

          {/* Compliance Screening (regulator's automated assessment) */}
          <div className="mb-4">
            <h6 className="text-secondary mb-3">Compliance Screening</h6>
            <div className="alert alert-light py-2 mb-2">
              <small className="text-muted">Produced by the regulator's automated screening service</small>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-2">
                  <span className={`badge ${screening.sanctionsChecked ? "bg-success" : "bg-danger"} me-2`}>
                    {screening.sanctionsChecked ? "\u2713" : "\u2717"}
                  </span>
                  <span>Sanctions Check: {screening.sanctionsChecked ? "Passed" : "Failed"}</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className={`badge ${screening.pep_check ? "bg-success" : "bg-danger"} me-2`}>
                    {screening.pep_check ? "\u2713" : "\u2717"}
                  </span>
                  <span>PEP Check: {screening.pep_check ? "Passed" : "Failed"}</span>
                </div>
              </div>
            </div>
          </div>

          <hr />

          {/* Risk Assessment */}
          <div className="mb-4">
            <h6 className="text-secondary mb-3">Risk Assessment</h6>
            <div className="d-flex align-items-center mb-3">
              <span className="me-3">
                <strong>Risk Score:</strong>
              </span>
              <div className="progress flex-grow-1" style={{ height: "25px" }}>
                <div
                  className={`progress-bar bg-${riskColor}`}
                  role="progressbar"
                  style={{ width: `${screening.riskScore || 0}%` }}
                  aria-valuenow={screening.riskScore || 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {screening.riskScore || 0}%
                </div>
              </div>
            </div>
            <p className="text-muted">
              <strong>AML Notes:</strong> {screening.amlNotes || "No notes"}
            </p>
          </div>

          <hr />

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <button
              className="btn btn-warning"
              onClick={handleFlagClick}
              disabled={currentParty?.role !== "regulator"}
            >
              Flag as Suspicious
            </button>
            <span className="text-muted ms-2">
              {currentParty?.role !== "regulator" && "(Regulator only)"}
            </span>
          </div>
        </div>
      </div>

      {/* Flag Suspicious Modal */}
      <Modal show={flagModalOpen} title="Flag as Suspicious" onClose={() => setFlagModalOpen(false)}>
        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            value={flagNotes}
            onChange={(e) => setFlagNotes(e.target.value)}
            placeholder="Provide details about why this transaction is suspicious..."
            rows={4}
          />
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-warning"
            onClick={handleFlagSubmit}
            disabled={flagLoading || !flagNotes.trim()}
          >
            {flagLoading ? "Flagging..." : "Flag Transaction"}
          </button>
          <button className="btn btn-secondary" onClick={() => setFlagModalOpen(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
};

export default CompliancePanel;
