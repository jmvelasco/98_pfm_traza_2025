import { useCallback, useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Provider';
import { web3Service } from '../lib/web3';

export function useWallet() {
  const { address, connect } = useWeb3();

  const isConnected = !!address;

  const getBalance = useCallback(async (addr?: string) => {
    const target = addr ?? address;
    if (!target) return '0.0';
    return web3Service.getBalance(target);
  }, [address]);

  const switchNetwork = useCallback(async (chainId: number) => {
    return web3Service.switchNetwork(chainId);
  }, []);

  const getCurrentNetwork = useCallback(async () => {
    return web3Service.getCurrentNetwork();
  }, []);

  return useMemo(() => ({
    address,
    isConnected,
    connect,
    getBalance,
    switchNetwork,
    getCurrentNetwork,
  }), [address, isConnected, connect, getBalance, switchNetwork, getCurrentNetwork]);
}
