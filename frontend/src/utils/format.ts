export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function formatAmount(amount?: string | number, currency?: string): string {
  if (!amount) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function statusColor(status?: string): string {
  switch (status) {
    case 'Initiated': return 'secondary';
    case 'ComplianceCheck': return 'warning';
    case 'Approved': return 'info';
    case 'Settled': return 'success';
    case 'Rejected': return 'danger';
    case 'Cancelled': return 'dark';
    default: return 'secondary';
  }
}
