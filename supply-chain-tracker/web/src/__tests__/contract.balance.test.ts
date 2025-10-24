import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserTokensWithBalance } from '../lib/contract';

// Mock ethers
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      ...(actual as any).ethers,
      JsonRpcProvider: vi.fn(),
    },
  };
});

describe('contract.getUserTokensWithBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tokens where user has balance > 0', async () => {
    // Mock contract responses
    const mockContract = {
      nextTokenId: vi.fn().mockResolvedValue(4n), // 3 tokens exist (IDs 1, 2, 3)
      getTokenBalance: vi
        .fn()
        .mockResolvedValueOnce(100n) // Token 1: balance 100
        .mockResolvedValueOnce(0n) // Token 2: balance 0
        .mockResolvedValueOnce(50n), // Token 3: balance 50
    };

    // Mock SupplyChain__factory.connect
    vi.doMock('../types/factories/SupplyChain__factory', () => ({
      SupplyChain__factory: {
        connect: vi.fn().mockReturnValue(mockContract),
      },
    }));

    const result = await getUserTokensWithBalance('0xfactory');

    // Should return only tokens with balance > 0
    expect(result).toEqual([1, 3]);
    expect(mockContract.getTokenBalance).toHaveBeenCalledTimes(3);
    expect(mockContract.getTokenBalance).toHaveBeenCalledWith(1, '0xfactory');
    expect(mockContract.getTokenBalance).toHaveBeenCalledWith(2, '0xfactory');
    expect(mockContract.getTokenBalance).toHaveBeenCalledWith(3, '0xfactory');
  });

  it('should return empty array when user has no tokens with balance', async () => {
    const mockContract = {
      nextTokenId: vi.fn().mockResolvedValue(3n),
      getTokenBalance: vi.fn().mockResolvedValueOnce(0n).mockResolvedValueOnce(0n),
    };

    vi.doMock('../types/factories/SupplyChain__factory', () => ({
      SupplyChain__factory: {
        connect: vi.fn().mockReturnValue(mockContract),
      },
    }));

    const result = await getUserTokensWithBalance('0xuser');
    expect(result).toEqual([]);
  });

  it('should return empty array on error', async () => {
    const mockContract = {
      nextTokenId: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    vi.doMock('../types/factories/SupplyChain__factory', () => ({
      SupplyChain__factory: {
        connect: vi.fn().mockReturnValue(mockContract),
      },
    }));

    const result = await getUserTokensWithBalance('0xuser');
    expect(result).toEqual([]);
  });
});
