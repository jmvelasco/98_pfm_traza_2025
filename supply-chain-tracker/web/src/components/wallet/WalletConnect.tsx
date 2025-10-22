import { useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';

function shortAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export function WalletConnect() {
  const { address, isConnected, networkName, connect } = useWallet();

  const onConnect = useCallback(async () => {
    await connect();
  }, [connect]);

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
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="px-2 py-0.5 bg-gray-100 rounded">{networkName ?? 'Unknown'}</span>
      <span className="font-mono">{address ? shortAddress(address) : ''}</span>
    </div>
  );
}
