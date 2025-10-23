import { ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { getTokenDetails, getUserTokens, type TokenDetails } from '../../lib/contract';
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
    if (!userAddress) {
      setLoading(false);
      return;
    }

    async function fetchTokens() {
      try {
        setLoading(true);
        setError(null);

        // Get token IDs owned by user
        const tokenIds = await getUserTokens(userAddress);

        // Fetch details for each token
        const details = await Promise.all(tokenIds.map((id) => getTokenDetails(id, userAddress)));

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
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [userAddress]);

  // Listen to TokenCreated events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || !userAddress) {
      return;
    }

    let provider: ethers.BrowserProvider;
    let contract: any;
    let handler: ((...args: any[]) => Promise<void>) | null = null;
    let eventFilter: any = null;

    async function setupEventListener() {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

        // Listen for TokenCreated events

        handler = async (...args: any[]) => {
          // ethers v6: event object with .args
          let tokenId, creator;
          if (args.length === 1 && args[0]?.args) {
            const a = args[0].args;
            tokenId = a?.tokenId ?? a?.id ?? a?.[0];
            creator = a?.creator ?? a?.owner ?? a?.[1];
          } else {
            // Defensive: ignore if not v6 event object
            return;
          }
          if (creator && creator.toLowerCase() === userAddress.toLowerCase()) {
            const idStr = tokenId?.toString ? tokenId.toString() : String(tokenId);
            if (seenIdsRef.current.has(idStr)) {
              return;
            }
            const details = await getTokenDetails(Number(tokenId), userAddress);
            if (details) {
              seenIdsRef.current.add(String(details.id));
              setTokens((prev) => {
                // Double-check in state in case of race
                if (prev.some((t) => String(t.id) === String(details.id))) return prev;
                return [...prev, details];
              });
            }
          }
        };
        // Prepare and register filter
        eventFilter = contract.filters.TokenCreated();
        contract.on(eventFilter, handler);
      } catch (e) {
        console.error('Error setting up event listener:', e);
      }
    }

    setupEventListener();

    // Cleanup listener on unmount
    return () => {
      if (contract && handler) {
        if (typeof contract.off === 'function') {
          try {
            contract.off(eventFilter ?? 'TokenCreated', handler);
          } catch {
            // fallback
            contract.removeAllListeners &&
              contract.removeAllListeners(eventFilter ?? 'TokenCreated');
          }
        } else if (typeof contract.removeListener === 'function') {
          try {
            contract.removeListener(eventFilter ?? 'TokenCreated', handler);
          } catch {
            contract.removeAllListeners &&
              contract.removeAllListeners(eventFilter ?? 'TokenCreated');
          }
        } else if (typeof contract.removeAllListeners === 'function') {
          contract.removeAllListeners(eventFilter ?? 'TokenCreated');
        }
      }
    };
  }, [userAddress]);

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
