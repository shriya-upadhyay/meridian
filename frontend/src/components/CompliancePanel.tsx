import React from "react";
// import useTransactionStore from "../stores/transactionStore";

const CompliancePanel: React.FC = () => {
  // TODO: Show AML/KYC data, risk score, flag suspicious button
  return (
    <div className="card mb-4">
      <div className="card-header">Compliance Data</div>
      <div className="card-body">
        <p>Sender: AliceCorp</p>
        <p>Recipient: BobLtd</p>
        <p>AML/KYC: Verified</p>
        <p>Risk Score: 12</p>
        <button className="btn btn-danger">Flag Suspicious</button>
      </div>
    </div>
  );
};

export default CompliancePanel;
