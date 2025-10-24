import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import * as contract from '../../lib/contract';

export default function PendingTransfers() {
  const { address } = useWallet();
  type Row = {
    id: string | number;
    tokenId: number;
    tokenName: string | null;
    amount: number;
    to: string;
    status: string;
    createdAt?: number;
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!address) return;
        const { items, total } = await (contract as any).getPendingBySender(
          address,
          offset,
          pageSize
        );
        if (mounted) {
          setRows(items as Row[]);
          setTotal(Number(total));
        }
      } catch {
        if (mounted) {
          setRows([]);
          setTotal(0);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [address, offset, pageSize]);
  return (
    <section>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Pending Transfers</h2>
      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No pending transfers at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Token</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                  Recipient
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-gray-600">
                    {r.tokenName || `Token #${r.tokenId}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.amount}</td>
                  <td className="px-4 py-2 text-gray-600">{r.to}</td>
                  <td className="px-4 py-2 text-gray-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + rows.length)} of{' '}
              {total}
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className="text-xs text-gray-600">
                Page {page} / {totalPages}
              </span>
              <button
                className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
