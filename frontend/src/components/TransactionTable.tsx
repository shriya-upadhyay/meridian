import React from "react";
// import StatusBadge from "./StatusBadge";
// TODO: Accept transactions, role as props

const TransactionTable: React.FC = () => {
  // TODO: Get transactions from store, render rows
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Tx ID</th>
          <th>Amount</th>
          <th>Currency</th>
          <th>Status</th>
          <th>Sender</th>
          <th>Recipient</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {/* Map over transactions here */}
        <tr>
          <td>TX123</td>
          <td>1000</td>
          <td>USD</td>
          <td>{/* <StatusBadge status="Settled" /> */}Settled</td>
          <td>AliceCorp</td>
          <td>BobLtd</td>
          <td>{/* Action buttons */}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default TransactionTable;
