import React from "react";
// import useProposalStore from "../stores/proposalStore";

const ProposalForm: React.FC = () => {
  // TODO: Form state, handle submit
  return (
    <form className="mb-4">
      <h5>Create New Proposal</h5>
      <div className="mb-2">
        <label className="form-label">Recipient</label>
        <select className="form-select">
          <option>BobLtd (Recipient)</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="form-label">Amount</label>
        <input type="number" className="form-control" />
      </div>
      <div className="mb-2">
        <label className="form-label">Currency</label>
        <input type="text" className="form-control" />
      </div>
      {/* Add sender/recipient details, compliance, FX rate fields as needed */}
      <button type="submit" className="btn btn-primary mt-2">Submit</button>
    </form>
  );
};

export default ProposalForm;
