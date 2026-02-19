import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { useTransactions } from "../stores/transactionStore";
import { usePartyStore } from "../stores/partyStore";
import Modal from "./Modal";

interface TransactionTableProps {
  role?: "sender" | "recipient" | "regulator";
}

const TransactionTable: React.FC<TransactionTableProps> = ({ role = "sender" }) => {
  const { transactions, loading, approveTransaction, rejectTransaction, settleTransaction } = useTransactions();
  const { currentParty } = usePartyStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    contractId: string;
    action: "reject" | "approve" | "settle";
    senderViewCid?: string;
    recipientViewCid?: string;
  } | null>(null);
  const [modalInput, setModalInput] = useState("");

  if (loading) {
    return <div className="alert alert-info">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="alert alert-warning">No transactions found</div>;
  }

  const handleApprove = (contractId: string) => {
    setModalData({ contractId, action: "approve" });
    setModalInput("");
    setModalOpen(true);
  };

  const handleReject = (contractId: string) => {
    setModalData({ contractId, action: "reject" });
    setModalInput("");
    setModalOpen(true);
  };

  const handleSettle = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await settleTransaction(contractId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalSubmit = async () => {
    if (!modalData) return;

    setActionLoading(modalData.contractId);
    try {
      if (modalData.action === "reject") {
        await rejectTransaction(modalData.contractId, modalInput);
      } else if (modalData.action === "approve") {
        // For approve, we need senderViewCid and recipientViewCid
        // In a real app, these would be fetched from views
        const senderViewCid = "sender-view-id"; // TODO: Get from views
        const recipientViewCid = "recipient-view-id"; // TODO: Get from views
        await approveTransaction(modalData.contractId, senderViewCid, recipientViewCid);
      }
      setModalOpen(false);
      setModalData(null);
      setModalInput("");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const payload = tx.payload as any;
              const senderName = payload?.senderDetails?.senderName || "Unknown";
              const recipientName = payload?.recipientDetails?.recipientName || "Unknown";
              const amount = payload?.amount || "N/A";
              const currency = payload?.currency || "N/A";
              const status = payload?.status || "Initiated";

              return (
                <tr key={tx.contractId}>
                  <td>
                    <code>{tx.contractId.substring(0, 8)}...</code>
                  </td>
                  <td>{amount}</td>
                  <td>{currency}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{senderName}</td>
                  <td>{recipientName}</td>
                  <td>
                    {role === "regulator" && (
                      <>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(tx.contractId)}
                          disabled={actionLoading === tx.contractId}
                        >
                          {actionLoading === tx.contractId ? "..." : "Approve"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => handleReject(tx.contractId)}
                          disabled={actionLoading === tx.contractId}
                        >
                          {actionLoading === tx.contractId ? "..." : "Reject"}
                        </button>
                      </>
                    )}
                    {role === "sender" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSettle(tx.contractId)}
                        disabled={actionLoading === tx.contractId}
                      >
                        {actionLoading === tx.contractId ? "Settling..." : "Settle"}
                      </button>
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

      <Modal
        show={modalOpen && modalData !== null}
        title={
          modalData?.action === "reject"
            ? "Reject Transaction"
            : modalData?.action === "approve"
            ? "Approve Transaction"
            : "Settle Transaction"
        }
        onClose={() => setModalOpen(false)}
      >
          <div className="mb-3">
            {modalData?.action === "reject" && (
              <>
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="form-control"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </>
            )}
            {modalData?.action === "approve" && (
              <p>Click confirm to approve this transaction.</p>
            )}
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleModalSubmit}
              disabled={modalData ? actionLoading === modalData.contractId : false}
            >
              {modalData && actionLoading === modalData.contractId ? "Processing..." : "Confirm"}
            </button>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
          </div>
      </Modal>
    </>
  );
};

export default TransactionTable;
