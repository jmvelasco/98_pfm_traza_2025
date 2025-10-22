import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyTokens from '../components/MyTokens';
import * as contractModule from '../lib/contract';

// Mock contract module
vi.mock('../lib/contract', () => ({
  getUserTokens: vi.fn(),
  getTokenDetails: vi.fn(),
}));

// Mock Web3Provider context
vi.mock('../contexts/Web3Provider', () => ({
  useWeb3: () => ({
    contract: {},
    provider: {},
  }),
}));

// Mock ethers BrowserProvider to avoid real provider checks
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: class {
      constructor(_arg: any) {}
    },
  },
}));

// Mock SupplyChain__factory to capture event listener registration
vi.mock('../types/factories/SupplyChain__factory', () => {
  let savedHandler: ((...args: any[]) => Promise<void> | void) | null = null;
  const contract = {
    filters: { TokenCreated: () => 'TokenCreated' },
    on: (_filter: any, handler: any) => {
      savedHandler = handler;
    },
    off: (_filter: any, handler: any) => {
      if (savedHandler === handler) savedHandler = null;
    },
    removeAllListeners: () => {
      savedHandler = null;
    },
  };
  return {
    SupplyChain__factory: {
      connect: vi.fn(() => contract),
    },
    __mock: {
      getListener: () => savedHandler,
      contract,
    },
  };
});

// @ts-expect-error test-only mock export provided via vi.mock above
import { __mock as factoryMock } from '../types/factories/SupplyChain__factory';

const mockTokenDetails = {
  id: 1,
  creator: '0x123',
  name: 'Wheat',
  totalSupply: 100,
  features: '{"country":"Spain"}',
  parentId: 0,
  dateCreated: 1700000000,
  balance: 100,
};

describe('MyTokens (TDD RED)', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('shows empty state if user owns no tokens', async () => {
    // Arrange: mock contract to return no tokens
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([]);

    render(<MyTokens userAddress="0x123" />);
    await waitFor(() => {
      expect(screen.getByText(/no tokens yet/i)).toBeInTheDocument();
    });
  });

  it('shows list of owned tokens with metadata', async () => {
    // Arrange: mock contract to return mockTokens
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([1]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    render(<MyTokens userAddress="0x123" />);
    await waitFor(() => {
      expect(screen.getByText(/Wheat/i)).toBeInTheDocument();
      expect(screen.getByText(/Spain/i)).toBeInTheDocument();
    });
  });

  it('updates UI in real time when TokenCreated event is emitted for user', async () => {
    // Arrange
    (window as any).ethereum = {};
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    render(<MyTokens userAddress="0x123" />);

    // Act: emit a TokenCreated event (TypeChain/ethers v6 style)
    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();
    await act(async () => {
      await listener!({ args: [1, '0x123'] });
    });

    // Assert: token is rendered
    await waitFor(() => {
      expect(screen.getByText(/Wheat/i)).toBeInTheDocument();
    });
  });

  it('does not update UI for TokenCreated events from other users', async () => {
    // Arrange
    (window as any).ethereum = {};
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    render(<MyTokens userAddress="0xABC" />);

    // Act: emit event with different creator
    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();
    await listener!({ args: [1, '0x123'] });

    // Assert: still empty state
    await waitFor(() => {
      expect(screen.getByText(/No tokens yet/i)).toBeInTheDocument();
    });
  });

  it('avoids duplicate appends when the same TokenCreated fires multiple times', async () => {
    // Arrange
    (window as any).ethereum = {};
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    render(<MyTokens userAddress="0x123" />);

    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();

    // Act: fire event twice
    await act(async () => {
      await listener!({ args: [1, '0x123'] });
    });
    await act(async () => {
      await listener!({ args: [1, '0x123'] });
    });

    // Assert: token appears only once
    await waitFor(() => {
      const items = screen.getAllByText(/Wheat/i);
      expect(items.length).toBe(1);
    });
  });
});
