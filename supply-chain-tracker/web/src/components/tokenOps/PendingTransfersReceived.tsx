import { usePendingTransfersList } from '../../hooks/usePendingTransfersList';
import { useWallet } from '../../hooks/useWallet';
import PendingTransfersTable from './PendingTransfersTable';

export default function PendingTransfersReceived() {
  const { address } = useWallet();
  const { items, total, page, setPage, loading, error } = usePendingTransfersList({
    mode: 'recipient',
    address,
    pageSize: 5,
  });

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
        />
      )}
    </section>
  );
}
