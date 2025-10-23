import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!address) return;
        const data = await (contract as any).getPendingTransfersBySender(address);
        if (mounted) setRows(data as Row[]);
      } catch {
        if (mounted) setRows([]);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [address]);
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
                  <td className="px-4 py-2">{r.tokenName || `Token #${r.tokenId}`}</td>
                  <td className="px-4 py-2">{r.amount}</td>
                  <td className="px-4 py-2">{r.to}</td>
                  <td className="px-4 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
