import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Web3Provider } from '../contexts/Web3Provider';
import { useWallet } from '../hooks/useWallet';

vi.mock('../lib/web3', () => ({
  web3Service: {
    connectWallet: vi.fn(),
    getBalance: vi.fn(),
    switchNetwork: vi.fn(),
    getCurrentNetwork: vi.fn(),
    isMetaMaskAvailable: vi.fn(),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}

describe('useWallet hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // minimal ethereum mock to avoid provider check crashes in context
    (window as any).ethereum = { request: vi.fn(), on: vi.fn(), removeListener: vi.fn(), isMetaMask: true };
  });

  it('exposes connection state and connect action (RED)', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    // initial state
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();

    // simulate connect through hook (will call context.connect internally)
    await act(async () => {
      await result.current.connect();
    });

    // For RED phase we only assert that method exists and returns without throwing
    expect(typeof result.current.connect).toBe('function');
  });

  it('returns balance via service (RED)', async () => {
    const { web3Service } = await import('../lib/web3');
    (web3Service.getBalance as any).mockResolvedValue('1.23');

    const { result } = renderHook(() => useWallet(), { wrapper });

    const balance = await result.current.getBalance('0x1234567890123456789012345678901234567890');
    expect(balance).toBe('1.23');
    expect(web3Service.getBalance).toHaveBeenCalled();
  });

  it('switches network using service (RED)', async () => {
    const { web3Service } = await import('../lib/web3');

    const { result } = renderHook(() => useWallet(), { wrapper });

    await result.current.switchNetwork(1);
    expect(web3Service.switchNetwork).toHaveBeenCalledWith(1);
  });

  it('provides network info from service (RED)', async () => {
    const { web3Service } = await import('../lib/web3');
    (web3Service.getCurrentNetwork as any).mockResolvedValue({ chainId: 1, name: 'Ethereum Mainnet' });

    const { result } = renderHook(() => useWallet(), { wrapper });

    const net = await result.current.getCurrentNetwork();
    expect(net).toEqual({ chainId: 1, name: 'Ethereum Mainnet' });
  });
});
