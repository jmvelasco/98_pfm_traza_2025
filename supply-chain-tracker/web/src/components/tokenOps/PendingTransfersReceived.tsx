import { useEffect, useState } from 'react';
import { usePendingTransfersList } from '../../hooks/usePendingTransfersList';
import { useWallet } from '../../hooks/useWallet';
import * as contract from '../../lib/contract';
import Alert from '../ui/Alert';

export default function PendingTransfersReceived() {
  const { address } = useWallet();
  const { items, total, page, setPage, loading, error, refresh } = usePendingTransfersList({
    mode: 'recipient',
    address,
    pageSize: 5,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);

  // Lightweight runtime diagnostics to investigate why actions may appear disabled
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return; // avoid noisy test output
    try {
      const rows = items.map((t) => ({
        id: t.id,
        to: String(t.to || ''),
        from: String(t.from || ''),
        status: t.status,
        canAct: !!address && !!t.to && address.toLowerCase() === String(t.to).toLowerCase(),
        processingId,
        address: address || '',
      }));
      // eslint-disable-next-line no-console
      console.debug('[IncomingTransfers][diagnostic]', {
        page,
        total,
        count: items.length,
        rows,
      });
    } catch (_) {
      // noop
    }
  }, [items, page, total, address, processingId]);

  async function onAccept(id: number | string) {
    setActionError(null);
    try {
      setProcessingId(id);
      await (contract as any).acceptTransfer(Number(id));
      refresh();
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  }

  async function onReject(id: number | string) {
    setActionError(null);
    try {
      setProcessingId(id);
      await (contract as any).rejectTransfer(Number(id));
      refresh();
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Incoming Transfers</h2>
      {error && (
        <Alert kind="error" className="mb-2">
          {error}
        </Alert>
      )}
      {actionError && (
        <Alert kind="error" className="mb-2">
          {actionError}
        </Alert>
      )}
      {loading && <Alert kind="neutral">Loading...</Alert>}
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
                      Sender
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((t) => {
                    const canAct =
                      !!address && !!t.to && address.toLowerCase() === String(t.to).toLowerCase();
                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-gray-600">
                          {t.tokenName || `Token #${t.tokenId}`}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{t.amount}</td>
                        <td className="px-4 py-2 text-gray-600">{t.from}</td>
                        <td className="px-4 py-2 text-gray-600">{t.status}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {canAct ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                name="accept"
                                className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded disabled:opacity-50"
                                disabled={processingId === t.id}
                                onClick={() => onAccept(t.id)}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                name="reject"
                                className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded disabled:opacity-50"
                                disabled={processingId === t.id}
                                onClick={() => onReject(t.id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
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
