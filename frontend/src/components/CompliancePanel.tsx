import React, { useState, useEffect } from "react";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";
import api from "../api";
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
  const [regulatorView, setRegulatorView] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Find the CrossBorderTx to get its txId, then fetch the matching RegulatorView
  // (RegulatorView has the full compliance data: senderInfo, recipientInfo, declaration, screening)
  useEffect(() => {
    if (!transactionId || !currentParty || currentParty.role !== 'regulator') {
      setRegulatorView(null);
      return;
    }

    const tx = transactions.find((t) => t.contractId === transactionId);
    if (!tx) {
      setRegulatorView(null);
      return;
    }

    const txId = (tx.payload as any)?.txId;
    if (!txId) return;

    setViewLoading(true);
    api.listRegulatorViews(currentParty.id).then((views) => {
      const match = views.find((v) => (v.payload as any)?.txId === txId);
      setRegulatorView(match || null);
    }).catch((err) => {
      console.error('Failed to fetch regulator views:', err);
      setRegulatorView(null);
    }).finally(() => {
      setViewLoading(false);
    });
  }, [transactionId, currentParty, transactions]);

  if (viewLoading) {
    return <div className="alert alert-info">Loading compliance data...</div>;
  }

  if (!regulatorView) {
    return <div className="alert alert-warning">No compliance data available. Select a transaction to view details.</div>;
  }

  const payload = regulatorView.payload as any;

  // RegulatorView has full compliance data
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
    if (!currentParty || !regulatorView) return;
    setFlagLoading(true);
    try {
      await api.flagSuspicious(currentParty.id, regulatorView.contractId, { notes: flagNotes });
      setFlagModalOpen(false);
      setFlagNotes("");
      // Re-fetch the regulator view to show updated AML notes
      const tx = transactions.find((t) => t.contractId === transactionId);
      if (tx) {
        const txId = (tx.payload as any)?.txId;
        if (txId) {
          const views = await api.listRegulatorViews(currentParty.id);
          const match = views.find((v) => (v.payload as any)?.txId === txId);
          setRegulatorView(match || null);
        }
      }
    } catch (err) {
      console.error('Failed to flag transaction:', err);
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <>
      <div className="card mb-4">
        <div className="compliance-header">
          <h5>Compliance & AML/KYC Data</h5>
        </div>
        <div className="card-body">
          {/* Transaction Overview */}
          <div className="row mb-4">
            <div className="col-md-3">
              <p><strong>Transaction ID:</strong> {payload?.txId || "N/A"}</p>
            </div>
            <div className="col-md-3">
              <p><strong>Send Amount:</strong> {payload?.amount != null && !isNaN(Number(payload.amount)) ? Number(payload.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"} {payload?.sendCurrency || ""}</p>
            </div>
            <div className="col-md-3">
              <p><strong>Receive Currency:</strong> {payload?.receiveCurrency || "N/A"}</p>
              {payload?.fxRate && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Rate: {payload.fxRate.rate} ({payload.fxRate.rateProvider})</p>}
            </div>
            <div className="col-md-3">
              <p><strong>Status:</strong> {payload?.status || "N/A"}</p>
            </div>
          </div>

          <hr />

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
