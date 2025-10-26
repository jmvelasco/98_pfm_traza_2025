import { ethers } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { useContractEvent } from '../../hooks/useContractEvent';
import { getTokenDetails, getUserTokensWithBalance, type TokenDetails } from '../../lib/contract';
import { SupplyChain__factory } from '../../types/factories/SupplyChain__factory';

interface MyTokensProps {
  userAddress: string;
}

export default function MyTokens({ userAddress }: MyTokensProps) {
  const [tokens, setTokens] = useState<TokenDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track seen token IDs to avoid duplicates from repeated events/StrictMode
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Fetch owned tokens on mount
  useEffect(() => {
    let mounted = true;
    if (!userAddress) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function fetchTokens() {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        // Get token IDs owned by user (based on balance > 0)
        const tokenIds = await getUserTokensWithBalance(userAddress);
        if (!mounted) return;

        // Fetch details for each token
        const details = await Promise.all(tokenIds.map((id) => getTokenDetails(id, userAddress)));
        if (!mounted) return;

        // Filter out nulls and merge with any tokens already appended via events
        const nonNull = details.filter((t): t is TokenDetails => t !== null);
        setTokens((prev) => {
          const byId = new Map<string, TokenDetails>();
          // keep any tokens already present (e.g., from realtime events)
          for (const t of prev) byId.set(String(t.id), t);
          // merge/overwrite with fetched details
          for (const t of nonNull) byId.set(String(t.id), t);
          return Array.from(byId.values());
        });
        // Seed/extend seen IDs set
        seenIdsRef.current = new Set([
          ...Array.from(seenIdsRef.current),
          ...nonNull.map((t) => String(t.id)),
        ]);
      } catch (e) {
        console.error('Error fetching tokens:', e);
        if (mounted) setError('Failed to load tokens');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTokens();
    return () => {
      mounted = false;
    };
  }, [userAddress]);

  // Handler for TokenCreated events
  const handleTokenCreated = useCallback(
    async (event: any) => {
      // ethers v6: event object with .args
      let tokenId, creator;
      if (event?.args) {
        const a = event.args;
        tokenId = a?.tokenId ?? a?.id ?? a?.[0];
        creator = a?.creator ?? a?.owner ?? a?.[1];
      } else {
        return;
      }

      if (creator && creator.toLowerCase() === userAddress.toLowerCase()) {
        const idStr = tokenId?.toString ? tokenId.toString() : String(tokenId);
        if (seenIdsRef.current.has(idStr)) {
          return;
        }

        try {
          const details = await getTokenDetails(Number(tokenId), userAddress);
          if (details) {
            seenIdsRef.current.add(String(details.id));
            setTokens((prev) => {
              if (prev.some((t) => String(t.id) === String(details.id))) return prev;
              return [...prev, details];
            });
          }
        } catch (e) {
          console.error('Error handling TokenCreated event:', e);
        }
      }
    },
    [userAddress]
  );

  // Handler for TransferAccepted events
  const handleTransferAccepted = useCallback(
    async (event: any) => {
      // ethers v6: event object with .args
      let transferId;
      if (event?.args) {
        const a = event.args;
        transferId = a?.transferId ?? a?.[0];
      } else {
        return;
      }

      try {
        // Need to get contract instance to call getTransfer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);
        const transfer = await contract.getTransfer(transferId);

        // Check if current user is recipient
        if (!transfer.to || transfer.to.toLowerCase() !== userAddress.toLowerCase()) {
          return;
        }

        // Fetch token details and append
        const tokenIdNum = Number(transfer.tokenId);
        const idStr = String(tokenIdNum);
        if (seenIdsRef.current.has(idStr)) {
          return;
        }

        const details = await getTokenDetails(tokenIdNum, userAddress);
        if (details) {
          seenIdsRef.current.add(String(details.id));
          setTokens((prev) => {
            if (prev.some((t) => String(t.id) === String(details.id))) return prev;
            return [...prev, details];
          });
        }
      } catch (e) {
        console.error('Error handling TransferAccepted event:', e);
      }
    },
    [userAddress]
  );

  // Listen to TokenCreated events using the hook
  useContractEvent('TokenCreated', handleTokenCreated, [handleTokenCreated]);

  // Listen to TransferAccepted events using the hook
  useContractEvent('TransferAccepted', handleTransferAccepted, [handleTransferAccepted]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading tokens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tokens yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => {
        let parsedFeatures: any = {};
        try {
          parsedFeatures = JSON.parse(token.features);
        } catch {
          // ignore parse errors
        }

        return (
          <div key={token.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg text-orange-600 font-semibold mb-2">{token.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Token ID:</span> {token.id}
              </p>
              <p>
                <span className="font-medium">Balance:</span> {token.balance}
              </p>
              <p>
                <span className="font-medium">Total Supply:</span> {token.totalSupply}
              </p>
              <p>
                <span className="font-medium">Parent ID:</span>{' '}
                {token.parentId === 0 ? 'Raw Material' : token.parentId}
              </p>
              {parsedFeatures.content && (
                <p>
                  <span className="font-medium">Content:</span> {parsedFeatures.content}
                </p>
              )}
              {parsedFeatures.country && (
                <p>
                  <span className="font-medium">Country:</span> {parsedFeatures.country}
                </p>
              )}
              {parsedFeatures.type && (
                <p>
                  <span className="font-medium">Type:</span> {parsedFeatures.type}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
