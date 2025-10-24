import type { ReactNode } from 'react';
import type { PendingTransfer } from '../../lib/contract';

export interface PendingTransfersTableProps {
  items: PendingTransfer[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  renderActions?: (transfer: PendingTransfer) => ReactNode;
  mode: 'sender' | 'recipient';
}

export default function PendingTransfersTable({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  renderActions,
  mode,
}: PendingTransfersTableProps) {
  const offset = (page - 1) * pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No pending transfers at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Token</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Amount</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
              {mode === 'sender' ? 'Recipient' : 'Sender'}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
            {renderActions && (
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-2 text-gray-600">{t.tokenName || `Token #${t.tokenId}`}</td>
              <td className="px-4 py-2 text-gray-600">{t.amount}</td>
              <td className="px-4 py-2 text-gray-600">{mode === 'sender' ? t.to : t.from}</td>
              <td className="px-4 py-2 text-gray-600">{t.status}</td>
              {renderActions && <td className="px-4 py-2 text-gray-600">{renderActions(t)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + items.length)} of {total}
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-xs text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
