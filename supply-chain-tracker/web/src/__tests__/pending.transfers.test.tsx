import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PendingTransfersSent from '../components/tokenOps/PendingTransfersSent';
import * as contract from '../lib/contract';

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xproducer' }),
}));

vi.mock('../lib/contract', () => ({
  getPendingBySender: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

// Mock ethers BrowserProvider to avoid real provider checks
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: class {
      constructor(_arg: any) {}
    },
  },
}));

// Mock SupplyChain__factory to capture TransferRequested listener
vi.mock('../types/factories/SupplyChain__factory', () => {
  let savedHandler: ((...args: any[]) => Promise<void> | void) | null = null;
  const contract = {
    filters: { TransferRequested: () => 'TransferRequested' },
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

describe('PendingTransfersSent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when there are no pending transfers', async () => {
    render(<PendingTransfersSent />);
    expect(screen.getByRole('heading', { name: /Outgoing Transfers/i })).toBeInTheDocument();
    expect(await screen.findByText(/No pending transfers/i)).toBeInTheDocument();
  });

  it('renders a list of pending transfers with basic fields', async () => {
    (contract as any).getPendingBySender.mockResolvedValue({
      items: [
        {
          id: 'tx1',
          tokenId: 1,
          tokenName: 'Wheat',
          amount: 10,
          from: '0xproducer',
          to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          status: 'Pending',
          createdAt: 1700000000,
        },
        {
          id: 'tx2',
          tokenId: 2,
          tokenName: null,
          amount: 5,
          from: '0xproducer',
          to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          status: 'Pending',
          createdAt: 1700001000,
        },
      ],
      total: 2,
    });

    render(<PendingTransfersSent />);

    // Renders token name or fallback "Token #ID"
    expect(await screen.findByText(/Wheat/i)).toBeInTheDocument();
    expect(screen.getByText(/Token #2/i)).toBeInTheDocument();

    // Renders amounts
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();

    // Renders recipient and status
    expect(screen.getByText('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBeInTheDocument();
    expect(screen.getAllByText(/Pending/i).length).toBeGreaterThan(0);
  });

  it('updates in real time when a TransferRequested from this sender is emitted', async () => {
    // Arrange: two sequential responses: empty -> one item
    (contract as any).getPendingBySender
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'tx3',
            tokenId: 7,
            tokenName: null,
            amount: 42,
            from: '0xproducer',
            to: '0xcccccccccccccccccccccccccccccccccccccccc',
            status: 'Pending',
            createdAt: 1700002000,
          },
        ],
        total: 1,
      });

    // Needed to allow event listener setup
    (window as any).ethereum = {};

    render(<PendingTransfersSent />);

    // Initially empty
    expect(await screen.findByText(/No pending transfers/i)).toBeInTheDocument();

    // Act: emit a TransferRequested event (ethers v6 typed shape: event object with args)
    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();
    await act(async () => {
      await listener!({
        args: [3n, '0xproducer', '0xcccccccccccccccccccccccccccccccccccccccc', 7n, 42n],
      });
    });

    // Assert: list now shows the new item (fallback name)
    await waitFor(() => {
      expect(screen.getByText(/Token #7/i)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('ignores TransferRequested events from other senders', async () => {
    // Arrange: always empty
    (contract as any).getPendingBySender.mockResolvedValue({ items: [], total: 0 });
    (window as any).ethereum = {};

    render(<PendingTransfersSent />);

    // Emit event from different address
    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();
    await act(async () => {
      await listener!({
        args: [4n, '0xother', '0xdddddddddddddddddddddddddddddddddddddddd', 9n, 1n],
      });
    });

    // Still empty
    await waitFor(() => {
      expect(screen.getByText(/No pending transfers/i)).toBeInTheDocument();
    });
  });

  it('does not duplicate when the same TransferRequested fires multiple times', async () => {
    // Arrange: empty -> one item -> one item (for second refresh)
    (contract as any).getPendingBySender
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'tx5',
            tokenId: 11,
            tokenName: 'Corn',
            amount: 3,
            from: '0xproducer',
            to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            status: 'Pending',
            createdAt: 1700003000,
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'tx5',
            tokenId: 11,
            tokenName: 'Corn',
            amount: 3,
            from: '0xproducer',
            to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            status: 'Pending',
            createdAt: 1700003000,
          },
        ],
        total: 1,
      });

    (window as any).ethereum = {};

    render(<PendingTransfersSent />);
    expect(await screen.findByText(/No pending transfers/i)).toBeInTheDocument();

    const listener = factoryMock.getListener();
    expect(listener).toBeTruthy();

    // Fire same event twice
    await act(async () => {
      await listener!({
        args: [5n, '0xproducer', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 11n, 3n],
      });
    });
    await act(async () => {
      await listener!({
        args: [5n, '0xproducer', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 11n, 3n],
      });
    });

    // Only one row shown
    await waitFor(() => {
      const rows = screen.getAllByText(/Corn/i);
      expect(rows.length).toBe(1);
    });
  });
});
