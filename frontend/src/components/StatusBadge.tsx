import React from "react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = "secondary";
  if (status === "Settled") color = "success";
  else if (status === "ComplianceCheck") color = "warning";
  else if (status === "Rejected") color = "danger";
  else if (status === "Approved") color = "primary";

  return <span className={`badge bg-${color}`}>{status}</span>;
};

export default StatusBadge;
