import { useEffect, useMemo, useState } from 'react';
import * as contract from '../lib/contract';

export type PendingTransfersMode = 'sender' | 'recipient';

export interface UsePendingTransfersListParams {
  mode: PendingTransfersMode;
  address: string | null;
  pageSize?: number;
}

export interface PendingTransfersListResult {
  items: contract.PendingTransfer[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePendingTransfersList({
  mode,
  address,
  pageSize = 5,
}: UsePendingTransfersListParams): PendingTransfersListResult {
  const [items, setItems] = useState<contract.PendingTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!address) {
        setItems([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result =
          mode === 'sender'
            ? await contract.getPendingBySender(address, offset, pageSize)
            : await contract.getPendingByRecipient(address, offset, pageSize);
        if (mounted) {
          setItems(result.items);
          setTotal(result.total);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Failed to load transfers');
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [address, offset, pageSize, mode, refreshFlag]);

  const refresh = () => setRefreshFlag((f) => f + 1);

  return { items, total, page, setPage, loading, error, refresh };
}
