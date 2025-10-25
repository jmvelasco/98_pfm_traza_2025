import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { CONTRACT_CONFIG, NETWORK_CONFIG } from '../config/contracts';
import type * as contract from '../lib/contract';
import { SupplyChain__factory } from '../types/factories/SupplyChain__factory';

export type TransfersAllMode = 'sender' | 'recipient';

export interface UseTransfersListAllParams {
  mode: TransfersAllMode;
  address: string | null;
  pageSize?: number;
}

export interface TransfersListAllResult {
  items: Array<contract.PendingTransfer & { status: 'Pending' | 'Accepted' | 'Rejected' }>;
  total: number;
  page: number;
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTransfersListAll({
  mode,
  address,
  pageSize = 5,
}: UseTransfersListAllParams): TransfersListAllResult {
  const [items, setItems] = useState<TransfersListAllResult['items']>([]);
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
        // Build read provider and contract
        const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
        const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

        // 1) Fetch all TransferRequested events
        // We fetch without indexed filtering for simplicity/compatibility and then filter in JS
        const requestFilter = (contract as any).filters.TransferRequested();
        const logs: any[] = await (contract as any).queryFilter(requestFilter, 0, 'latest');

        // 2) Filter by participant based on mode
        const byAddr = logs.filter((ev: any) => {
          const a = ev?.args ?? {};
          const from = a.from ?? a[1];
          const to = a.to ?? a[2];
          if (!from && !to) return false;
          if (mode === 'sender') return String(from).toLowerCase() === address.toLowerCase();
          return String(to).toLowerCase() === address.toLowerCase();
        });

        // 3) Collect unique transfer IDs
        const idSet = new Set<number>();
        for (const ev of byAddr) {
          const a = ev?.args ?? {};
          const id = Number(a.transferId ?? a[0] ?? 0);
          if (id > 0) idSet.add(id);
        }

        const ids = Array.from(idSet);

        // 4) Fetch transfer details for each id and map
        // Note: we fetch details for all ids first, then apply pagination on the sorted result
        const transfersRaw: Array<
          contract.PendingTransfer & { status: 'Pending' | 'Accepted' | 'Rejected' }
        > = await Promise.all(
          ids.map(async (id) => {
            try {
              const t: any = await (contract as any).getTransfer(BigInt(id));
              const tokenId = Number(t.tokenId ?? t[3] ?? 0);
              let tokenName: string | null = null;
              try {
                const tok = await (contract as any).getToken(BigInt(tokenId));
                tokenName = tok?.name ?? tok?.[2] ?? null;
              } catch {
                // ignore token name failures
              }
              // Map status enum
              const statusNum = Number(t.status ?? t[6] ?? 0);
              const status: 'Pending' | 'Accepted' | 'Rejected' =
                statusNum === 1 ? 'Accepted' : statusNum === 2 ? 'Rejected' : 'Pending';
              const fromAddr = String(t.from ?? t[1] ?? '');
              const toAddr = String(t.to ?? t[2] ?? '');
              const createdAt = Number(t.dateCreated ?? t[4] ?? 0);
              return {
                id,
                tokenId,
                tokenName,
                amount: Number(t.amount ?? t[5] ?? 0),
                from: fromAddr,
                to: toAddr,
                status,
                createdAt,
              } as TransfersListAllResult['items'][number];
            } catch {
              return null as unknown as TransfersListAllResult['items'][number];
            }
          })
        );

        const valid = transfersRaw.filter(Boolean) as TransfersListAllResult['items'];

        // 5) Sort by creation date desc and paginate
        valid.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        const totalAll = valid.length;
        const pageItems = valid.slice(offset, offset + pageSize);

        if (!mounted) return;
        const totalPages = Math.max(1, Math.ceil(totalAll / pageSize));
        if (totalAll > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setItems(pageItems);
        setTotal(totalAll);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Failed to load transfers');
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [address, offset, pageSize, mode, refreshFlag, page]);

  const refresh = () => setRefreshFlag((x) => x + 1);

  return { items, total, page, setPage, loading, error, refresh };
}
