import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';

function shortAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return '0.00';
  if (num < 0.001) return '< 0.001';
  if (num < 1) return num.toFixed(4);
  if (num < 100) return num.toFixed(3);
  return num.toFixed(2);
}

export function WalletConnect() {
  const { address, isConnected, networkName, connect, getBalance } = useWallet();
  const [balance, setBalance] = useState<string>('0.0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const onConnect = useCallback(async () => {
    await connect();
  }, [connect]);

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && address && getBalance) {
      setIsLoadingBalance(true);
      getBalance(address)
        .then((bal) => setBalance(bal))
        .catch(() => setBalance('0.0'))
        .finally(() => setIsLoadingBalance(false));
    } else {
      setBalance('0.0');
      setIsLoadingBalance(false);
    }
  }, [isConnected, address, getBalance]);

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Connect
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Network Badge */}
      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium">
        {networkName ?? 'Unknown'}
      </span>

      {/* Balance Display */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600 font-medium">Balance:</span>
        </div>
        {isLoadingBalance ? (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-blue-600 font-mono text-xs">Loading...</span>
          </div>
        ) : (
          <span className="font-mono font-semibold text-blue-700">
            {formatBalance(balance)} ETH
          </span>
        )}
      </div>

      {/* Address Display */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-mono text-gray-700 font-medium">
          {address ? shortAddress(address) : ''}
        </span>
      </div>
    </div>
  );
}
