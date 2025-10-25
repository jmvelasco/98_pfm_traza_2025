import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
// we'll import the component dynamically inside tests after setting mocks

// Ensure default pending hook returns empty, so only our mocked all-status hook supplies data
vi.mock('../lib/contract', () => ({
  getPendingBySender: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xproducer' }),
}));

// Mock ethers BrowserProvider to avoid real provider checks
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: class {
      constructor(_arg: any) {}
    },
  },
}));

// Mock SupplyChain__factory to capture listeners for multiple events
vi.mock('../types/factories/SupplyChain__factory', () => {
  const saved: Record<string, ((...args: any[]) => Promise<void> | void) | null> = {
    TransferRequested: null,
    TransferAccepted: null,
    TransferRejected: null,
  };
  const contract = {
    filters: {
      TransferRequested: () => 'TransferRequested',
      TransferAccepted: () => 'TransferAccepted',
      TransferRejected: () => 'TransferRejected',
    },
    on: (filter: any, handler: any) => {
      saved[String(filter)] = handler;
    },
    off: (filter: any, handler: any) => {
      if (saved[String(filter)] === handler) saved[String(filter)] = null;
    },
    removeAllListeners: () => {
      Object.keys(saved).forEach((k) => (saved[k] = null));
    },
  };
  return {
    SupplyChain__factory: {
      connect: vi.fn(() => contract),
    },
    __mock: {
      getListener: (evt: string) => saved[evt],
      contract,
    },
  };
});

// @ts-expect-error test-only mock export provided via vi.mock above
import { __mock as factoryMock } from '../types/factories/SupplyChain__factory';

describe('PendingTransfersSent (all statuses)', () => {
  it('renders Accepted and Rejected transfers when showAllStatuses is enabled', async () => {
    vi.resetModules();
    // Provide a one-off mock for the unified hook (all-status mode via component prop)
    vi.doMock('../hooks/useTransfersList', () => ({
      useTransfersList: () => ({
        items: [
          {
            id: 'txA',
            tokenId: 1,
            tokenName: 'Wheat',
            amount: 10,
            from: '0xproducer',
            to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            status: 'Accepted',
            createdAt: 1700000000,
          },
          {
            id: 'txR',
            tokenId: 2,
            tokenName: null,
            amount: 5,
            from: '0xproducer',
            to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            status: 'Rejected',
            createdAt: 1700001000,
          },
        ],
        total: 2,
        page: 1,
        setPage: () => {},
        loading: false,
        error: null,
        refresh: () => {},
      }),
    }));

    const { default: Component } = await import('../components/tokenOps/PendingTransfersSent');
    render(<Component showAllStatuses={true} />);

    // Shows table rows with Accepted and Rejected statuses
    expect(await screen.findByText(/Wheat/i)).toBeInTheDocument();
    expect(screen.getByText(/Token #2/i)).toBeInTheDocument();
    expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
  });

  it('updates to Accepted in real time on TransferAccepted', async () => {
    (window as any).ethereum = {};
    vi.resetModules();
    // First call: pending; second call after event: accepted
    const results = [
      {
        items: [
          {
            id: 'tx1',
            tokenId: 7,
            tokenName: 'Barley',
            amount: 2,
            from: '0xproducer',
            to: '0xcccccccccccccccccccccccccccccccccccccccc',
            status: 'Pending',
            createdAt: 1700002000,
          },
        ],
        total: 1,
        page: 1,
        setPage: () => {},
        loading: false,
        error: null,
        refresh: vi.fn(),
      },
      {
        items: [
          {
            id: 'tx1',
            tokenId: 7,
            tokenName: 'Barley',
            amount: 2,
            from: '0xproducer',
            to: '0xcccccccccccccccccccccccccccccccccccccccc',
            status: 'Accepted',
            createdAt: 1700002000,
          },
        ],
        total: 1,
        page: 1,
        setPage: () => {},
        loading: false,
        error: null,
        refresh: vi.fn(),
      },
    ];

    let idx = 0;
    vi.doMock('../hooks/useTransfersList', () => ({
      useTransfersList: () => results[Math.min(idx, results.length - 1)],
    }));

    const { default: Component } = await import('../components/tokenOps/PendingTransfersSent');
    render(<Component showAllStatuses={true} />);

    expect(await screen.findByText(/Barley/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();

    // Emit Accepted event and switch mocked response to accepted
    idx = 1;
    const accepted = factoryMock.getListener('TransferAccepted');
    expect(accepted).toBeTruthy();
    await act(async () => {
      await accepted!({ args: [1n] });
    });

    await waitFor(() => {
      expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
    });
  });

  it('updates to Rejected in real time on TransferRejected', async () => {
    (window as any).ethereum = {};
    vi.resetModules();
    const results = [
      {
        items: [
          {
            id: 'tx9',
            tokenId: 3,
            tokenName: null,
            amount: 1,
            from: '0xproducer',
            to: '0xdddddddddddddddddddddddddddddddddddddddd',
            status: 'Pending',
            createdAt: 1700001000,
          },
        ],
        total: 1,
        page: 1,
        setPage: () => {},
        loading: false,
        error: null,
        refresh: vi.fn(),
      },
      {
        items: [
          {
            id: 'tx9',
            tokenId: 3,
            tokenName: null,
            amount: 1,
            from: '0xproducer',
            to: '0xdddddddddddddddddddddddddddddddddddddddd',
            status: 'Rejected',
            createdAt: 1700001000,
          },
        ],
        total: 1,
        page: 1,
        setPage: () => {},
        loading: false,
        error: null,
        refresh: vi.fn(),
      },
    ];
    let idx = 0;
    vi.doMock('../hooks/useTransfersList', () => ({
      useTransfersList: () => results[Math.min(idx, results.length - 1)],
    }));

    const { default: Component } = await import('../components/tokenOps/PendingTransfersSent');
    render(<Component showAllStatuses={true} />);

    expect(await screen.findByText(/Token #3/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();

    idx = 1;
    const rejected = factoryMock.getListener('TransferRejected');
    expect(rejected).toBeTruthy();
    await act(async () => {
      await rejected!({ args: [9n] });
    });

    await waitFor(() => {
      expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
    });
  });
});
