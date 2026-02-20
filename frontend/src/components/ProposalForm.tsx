import React, { useState } from "react";
import { useProposals } from "../stores/proposalStore";
import { usePartyStore } from "../stores/partyStore";
import { CreateProposalRequest } from "../../../backend/src/types";
import { generateCommandId } from "../utils/commandId";

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

const ProposalForm: React.FC = () => {
  const { createProposal } = useProposals();
  const { currentParty } = usePartyStore();

  const [formData, setFormData] = useState({
    recipient: "BobLtd_London",
    regulator: "MAS_Regulator",
    amount: "1000",
    sendCurrency: "USD",
    receiveCurrency: "GBP",
    // Sender details
    senderName: "Alice Corp",
    senderAccount: "ACC001",
    senderBankSwift: "ALICESG",
    senderCountry: "Singapore",
    senderTaxId: "TAX001",
    // Recipient details
    recipientName: "Bob Ltd",
    recipientAccount: "GB82-WEST-1234-5698-7654-32",
    recipientBankSwift: "WESTGB2L",
    recipientCountry: "United Kingdom",
    recipientTaxId: "GB-987654321",
    // Declaration
    purposeOfPayment: "International trade",
    sourceOfFunds: "Business operations",
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

      const hash = await sha256(formData.senderAccount);

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
        recipientInfo: {
          recipientName: formData.recipientName,
          recipientAccount: formData.recipientAccount,
          recipientBankSwift: formData.recipientBankSwift,
          recipientCountry: formData.recipientCountry,
          recipientTaxId: formData.recipientTaxId,
          recipientAccountHash: hash
        },
        declaration: {
          purposeOfPayment: formData.purposeOfPayment,
          sourceOfFunds: formData.sourceOfFunds,
        },
        amount: formData.amount,
        sendCurrency: formData.sendCurrency,
        receiveCurrency: formData.receiveCurrency,
      };

      await createProposal(proposal);

      // Reset form on success
      setFormData({
        recipient: "BobLtd_London",
        regulator: "MAS_Regulator",
        amount: "1000",
        sendCurrency: "USD",
        receiveCurrency: "GBP",
        senderName: "Alice Corp",
        senderAccount: "ACC001",
        senderBankSwift: "ALICESG",
        senderCountry: "Singapore",
        senderTaxId: "TAX001",
        recipientName: "Bob Ltd",
        recipientAccount: "GB82-WEST-1234-5698-7654-32",
        recipientBankSwift: "WESTGB2L",
        recipientCountry: "United Kingdom",
        recipientTaxId: "GB-987654321",
        purposeOfPayment: "International trade",
        sourceOfFunds: "Business operations",
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
            <label className="form-label">Recipient Party</label>
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
        <div className="col-md-3">
          <div className="mb-3">
            <label className="form-label">Send Currency</label>
            <select
              name="sendCurrency"
              value={formData.sendCurrency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="SGD">SGD</option>
              <option value="HKD">HKD</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="mb-3">
            <label className="form-label">Receive Currency</label>
            <select
              name="receiveCurrency"
              value={formData.receiveCurrency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="SGD">SGD</option>
              <option value="HKD">HKD</option>
              <option value="AED">AED</option>
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
            <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input type="text" name="senderAccount" value={formData.senderAccount} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Bank SWIFT Code</label>
            <input type="text" name="senderBankSwift" value={formData.senderBankSwift} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <input type="text" name="senderCountry" value={formData.senderCountry} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Tax ID</label>
            <input type="text" name="senderTaxId" value={formData.senderTaxId} onChange={handleChange} className="form-control" />
          </div>
        </div>
      </div>

      {/* Recipient Details */}
      <h6 className="mt-4 mb-3">Recipient Details</h6>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input type="text" name="recipientAccount" value={formData.recipientAccount} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Bank SWIFT Code</label>
            <input type="text" name="recipientBankSwift" value={formData.recipientBankSwift} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <input type="text" name="recipientCountry" value={formData.recipientCountry} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Tax ID</label>
            <input type="text" name="recipientTaxId" value={formData.recipientTaxId} onChange={handleChange} className="form-control" />
          </div>
        </div>
      </div>

      {/* Sender Declaration */}
      <h6 className="mt-4 mb-3">Your Declaration</h6>
      <div className="alert alert-secondary py-2 mb-3">
        <small>Declare the purpose and source of funds. Compliance screening (risk score, sanctions, PEP checks) is performed automatically by the regulator.</small>
      </div>
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
              placeholder="e.g. International trade, consulting services"
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
              placeholder="e.g. Business operations, investment income"
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
