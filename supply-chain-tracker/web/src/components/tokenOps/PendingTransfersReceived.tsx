import { usePendingTransfersList } from '../../hooks/usePendingTransfersList';
import { useWallet } from '../../hooks/useWallet';
import * as contract from '../../lib/contract';
import PendingTransfersTable from './PendingTransfersTable';

export default function PendingTransfersReceived() {
  const { address } = useWallet();
  const { items, total, page, setPage, loading, error, refresh } = usePendingTransfersList({
    mode: 'recipient',
    address,
    pageSize: 5,
  });

  async function onAccept(id: number | string) {
    await (contract as any).acceptTransfer(Number(id));
    refresh();
  }

  async function onReject(id: number | string) {
    await (contract as any).rejectTransfer(Number(id));
    refresh();
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-blue-400 mb-4">Received Pending Transfers</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && (
        <PendingTransfersTable
          items={items}
          total={total}
          page={page}
          pageSize={5}
          onPageChange={setPage}
          mode="recipient"
          renderActions={(t) => (
            <div className="flex gap-2">
              <button
                type="button"
                name="accept"
                className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded"
                onClick={() => onAccept(t.id)}
              >
                Accept
              </button>
              <button
                type="button"
                name="reject"
                className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded"
                onClick={() => onReject(t.id)}
              >
                Reject
              </button>
            </div>
          )}
        />
      )}
    </section>
  );
}
