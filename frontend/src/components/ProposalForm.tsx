import React, { useState } from "react";
import { useProposals } from "../stores/proposalStore";
import { usePartyStore } from "../stores/partyStore";
import { CreateProposalRequest } from "../../../backend/src/types";
import { generateCommandId } from "../utils/commandId";

const ProposalForm: React.FC = () => {
  const { createProposal } = useProposals();
  const { currentParty } = usePartyStore();

  const [formData, setFormData] = useState({
    recipient: "BobLtd_London",
    regulator: "MAS_Regulator",
    amount: "1000",
    currency: "USD",
    senderName: "Alice Corp",
    senderAccount: "ACC001",
    senderBankSwift: "ALICESG",
    senderCountry: "Singapore",
    senderTaxId: "TAX001",
    recipientName: "Bob Ltd",
    recipientBic: "WESTGB2L",
    purposeOfPayment: "International trade",
    sourceOfFunds: "Business operations",
    riskScore: "15",
    amlNotes: "Standard AML check passed",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!currentParty) {
        throw new Error("No party selected");
      }

      const proposal: CreateProposalRequest = {
        recipient: formData.recipient,
        regulator: formData.regulator,
        txId: generateCommandId(),
        senderInfo: {
          senderName: formData.senderName,
          senderAccount: formData.senderAccount,
          senderBankSwift: formData.senderBankSwift,
          senderCountry: formData.senderCountry,
          senderTaxId: formData.senderTaxId,
        },
        recipientName: formData.recipientName,
        recipientBic: formData.recipientBic,
        compliance: {
          purposeOfPayment: formData.purposeOfPayment,
          sourceOfFunds: formData.sourceOfFunds,
          riskScore: parseInt(formData.riskScore),
          sanctionsChecked: true,
          pep_check: true,
          amlNotes: formData.amlNotes,
        },
        amount: formData.amount,
        currency: formData.currency,
      };

      await createProposal(proposal);

      // Reset form on success
      setFormData({
        recipient: "BobLtd_London",
        regulator: "MAS_Regulator",
        amount: "1000",
        currency: "USD",
        senderName: "Alice Corp",
        senderAccount: "ACC001",
        senderBankSwift: "ALICESG",
        senderCountry: "Singapore",
        senderTaxId: "TAX001",
        recipientName: "Bob Ltd",
        recipientBic: "WESTGB2L",
        purposeOfPayment: "International trade",
        sourceOfFunds: "Business operations",
        riskScore: "15",
        amlNotes: "Standard AML check passed",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create proposal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-4 p-4">
      <h5 className="mb-4">Create New Cross-Border Proposal</h5>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="row">
        {/* Basic Transaction Info */}
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Recipient</label>
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              className="form-select"
            >
              <option value="BobLtd_London">BobLtd (Recipient)</option>
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Regulator</label>
            <select
              name="regulator"
              value={formData.regulator}
              onChange={handleChange}
              className="form-select"
            >
              <option value="MAS_Regulator">MAS (Regulator)</option>
            </select>
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-control"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sender Details */}
      <h6 className="mt-4 mb-3">Sender Details (Your Information)</h6>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              name="senderAccount"
              value={formData.senderAccount}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Bank SWIFT Code</label>
            <input
              type="text"
              name="senderBankSwift"
              value={formData.senderBankSwift}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="senderCountry"
              value={formData.senderCountry}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Tax ID</label>
            <input
              type="text"
              name="senderTaxId"
              value={formData.senderTaxId}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Recipient (Public Info Only) */}
      <h6 className="mt-4 mb-3">Recipient (Public Info Only)</h6>
      <div className="alert alert-info py-2 mb-3">
        <small>You only need the institution name and BIC code. The recipient's bank details are resolved automatically and kept private.</small>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Institution Name</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Bob Ltd"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">BIC Code</label>
            <input
              type="text"
              name="recipientBic"
              value={formData.recipientBic}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. WESTGB2L"
            />
          </div>
        </div>
      </div>

      {/* Compliance Info */}
      <h6 className="mt-4 mb-3">Compliance & AML/KYC</h6>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Purpose of Payment</label>
            <input
              type="text"
              name="purposeOfPayment"
              value={formData.purposeOfPayment}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Source of Funds</label>
            <input
              type="text"
              name="sourceOfFunds"
              value={formData.sourceOfFunds}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Risk Score (0-100)</label>
            <input
              type="number"
              name="riskScore"
              value={formData.riskScore}
              onChange={handleChange}
              className="form-control"
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">AML Notes</label>
            <input
              type="text"
              name="amlNotes"
              value={formData.amlNotes}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-4"
        disabled={loading || !currentParty}
      >
        {loading ? "Creating..." : "Create Proposal"}
      </button>
    </form>
  );
};

export default ProposalForm;
