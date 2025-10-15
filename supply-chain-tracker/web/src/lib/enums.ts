// Minimal enum mapping for roles and statuses
export const ROLES = [
  { value: 'Producer', label: 'Producer' },
  { value: 'Factory', label: 'Factory' },
  { value: 'Retailer', label: 'Retailer' },
  { value: 'Consumer', label: 'Consumer' },
];

export const STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
};
