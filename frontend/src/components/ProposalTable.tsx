import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { useProposals } from "../stores/proposalStore";
import { usePartyStore } from "../stores/partyStore";

interface ProposalTableProps {
  role?: "sender" | "recipient" | "regulator";
}

const ProposalTable: React.FC<ProposalTableProps> = ({ role = "sender" }) => {
  const { proposals, loading, acceptProposal, withdrawProposal } = useProposals();
  const { currentParty } = usePartyStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return <div className="alert alert-info">Loading proposals...</div>;
  }

  if (proposals.length === 0) {
    return <div className="alert alert-warning">No proposals found</div>;
  }

  const handleAccept = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await acceptProposal(contractId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await withdrawProposal(contractId);
    } finally {
      setActionLoading(null);
    }
  };

  console.log(proposals)

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
          {proposals.map((proposal) => {
            const payload = proposal.payload as any;
            const senderName = payload?.senderInfo?.senderName || "Unknown";
            const recipientName = payload?.recipientInfo?.recipientName || "Unknown";
            const amount = payload?.amount != null && !isNaN(Number(payload.amount)) ? Number(payload.amount).toFixed(2) : "N/A";
            const sendCurrency = payload?.sendCurrency || "N/A";
            const receiveCurrency = payload?.receiveCurrency || "N/A";
            const status = payload?.status || "Initiated";

            return (
              <tr key={proposal.contractId}>
                <td>
                  <code>{proposal.contractId.substring(0, 8)}...</code>
                </td>
                <td>{amount}</td>
                <td>{sendCurrency} → {receiveCurrency}</td>
                <td>
                  <StatusBadge status={status} />
                </td>
                <td>{senderName}</td>
                <td>{recipientName}</td>
                <td>
                  {role === "recipient" && (
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleAccept(proposal.contractId)}
                      disabled={actionLoading === proposal.contractId}
                    >
                      {actionLoading === proposal.contractId ? "Accepting..." : "Accept"}
                    </button>
                  )}
                  {role === "sender" && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleWithdraw(proposal.contractId)}
                      disabled={actionLoading === proposal.contractId}
                    >
                      {actionLoading === proposal.contractId ? "Withdrawing..." : "Withdraw"}
                    </button>
                  )}
                  {role === "regulator" && (
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

export default ProposalTable;
