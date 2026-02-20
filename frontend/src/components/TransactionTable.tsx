import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";

interface TransactionTableProps {
  role?: "sender" | "recipient" | "regulator";
  onSelectTransaction?: (contractId: string) => void;
  selectedTransactionId?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ role = "sender", onSelectTransaction, selectedTransactionId }) => {
  const { transactions, loading, freezeTransaction, settleTransaction } = useTransactions();
  const { currentParty } = usePartyStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return <div className="alert alert-info">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="alert alert-warning">No transactions found</div>;
  }

  const handleFreeze = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await freezeTransaction(contractId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettle = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await settleTransaction(contractId);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Contract ID</th>
            <th>Amount</th>
            <th>Currencies</th>
            <th>Status</th>
            <th>Sender</th>
            <th>Recipient</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const payload = tx.payload as any;
            const senderName = payload?.senderName || "Unknown";
            const recipientName = payload?.recipientName || "Unknown";
            const amount = payload?.amount != null && !isNaN(Number(payload.amount)) ? Number(payload.amount).toFixed(2) : "N/A";
            const sendCurrency = payload?.sendCurrency || "N/A";
            const receiveCurrency = payload?.receiveCurrency || "N/A";
            const status = payload?.status || "Approved";

            const isSelected = selectedTransactionId === tx.contractId;

            return (
              <tr key={tx.contractId} className={isSelected ? 'selected-row' : ''}>
                <td
                  onClick={() => onSelectTransaction?.(tx.contractId)}
                >
                  <span className={onSelectTransaction ? 'clickable-id' : ''}>
                    {tx.contractId.substring(0, 8)}...
                  </span>
                </td>
                <td>{amount}</td>
                <td>{sendCurrency} → {receiveCurrency}</td>
                <td>
                  <StatusBadge status={status} />
                </td>
                <td>{senderName}</td>
                <td>{recipientName}</td>
                <td>
                  {role === "regulator" && status === "Approved" && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleFreeze(tx.contractId)}
                      disabled={actionLoading === tx.contractId}
                    >
                      {actionLoading === tx.contractId ? "Freezing..." : "Freeze"}
                    </button>
                  )}
                  {role === "regulator" && status !== "Approved" && (
                    <span className="text-muted">
                      {status === "Frozen" ? "Frozen" : status === "Settled" ? "Settled" : "—"}
                    </span>
                  )}
                  {role === "sender" && status === "Approved" && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSettle(tx.contractId)}
                      disabled={actionLoading === tx.contractId}
                    >
                      {actionLoading === tx.contractId ? "Settling..." : "Settle"}
                    </button>
                  )}
                  {role === "sender" && status !== "Approved" && (
                    <span className="text-muted">
                      {status === "Settled" ? "Settled" : status === "Frozen" ? "Frozen" : "—"}
                    </span>
                  )}
                  {role === "recipient" && (
                    <span className="text-muted">View Only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
