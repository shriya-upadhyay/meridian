import React from "react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = "secondary";
  if (status === "Settled") color = "success";
  else if (status === "Approved") color = "primary";
  else if (status === "Frozen") color = "danger";

  return <span className={`badge bg-${color}`}>{status}</span>;
};

export default StatusBadge;
