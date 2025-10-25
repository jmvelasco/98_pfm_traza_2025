import { ethers } from 'ethers';
import { useEffect } from 'react';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { usePendingTransfersList } from '../../hooks/usePendingTransfersList';
import { useWallet } from '../../hooks/useWallet';
import { SupplyChain__factory } from '../../types/factories/SupplyChain__factory';

export default function PendingTransfersSent() {
  const { address } = useWallet();
  const { items, total, page, setPage, loading, error, refresh } = usePendingTransfersList({
    mode: 'sender',
    address,
    pageSize: 5,
  });

  // Realtime: refresh list when a new TransferRequested is emitted from this address
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || !address) return;

    let provider: ethers.BrowserProvider | null = null;
    let contract: any = null;
    let handler: ((...args: any[]) => void) | null = null;
    let eventFilter: any = null;

    async function setup() {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

        handler = (...eventArgs: any[]) => {
          // ethers v6 typed event object style
          if (eventArgs.length === 1 && eventArgs[0]?.args) {
            const a = eventArgs[0].args;
            const from = a?.from ?? a?.[1];
            if (from && address && String(from).toLowerCase() === address.toLowerCase()) {
              // Trigger a refresh; pagination and dedupe are handled by the hook/backend
              refresh();
            }
          }
        };

        eventFilter = contract.filters.TransferRequested();
        contract.on(eventFilter, handler);
      } catch (e) {
        console.error('Failed to setup TransferRequested listener:', e);
      }
    }

    void setup();

    return () => {
      if (contract && handler) {
        try {
          if (typeof contract.off === 'function') {
            contract.off(eventFilter ?? 'TransferRequested', handler);
          } else if (typeof contract.removeListener === 'function') {
            contract.removeListener(eventFilter ?? 'TransferRequested', handler);
          } else if (typeof contract.removeAllListeners === 'function') {
            contract.removeAllListeners(eventFilter ?? 'TransferRequested');
          }
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [address, refresh]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Outgoing Transfers</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && (
        <div>
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No pending transfers at the moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Token
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Recipient
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-gray-600">
                        {t.tokenName || `Token #${t.tokenId}`}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{t.amount}</td>
                      <td className="px-4 py-2 text-gray-600">{t.to}</td>
                      <td className="px-4 py-2 text-gray-600">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-3 border-t bg-gray-50">
                <div className="text-xs text-gray-500">
                  {(() => {
                    const offset = (page - 1) * 5;
                    return (
                      <span>
                        Showing {Math.min(total, offset + 1)}–
                        {Math.min(total, offset + items.length)} of {total}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {page} / {Math.max(1, Math.ceil(total / 5))}
                  </span>
                  <button
                    className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
                    onClick={() => setPage(Math.min(Math.max(1, Math.ceil(total / 5)), page + 1))}
                    disabled={page >= Math.max(1, Math.ceil(total / 5))}
                    aria-label="Next"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
