import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTransfersList } from '../hooks/useTransfersList';

// RED: pending-only behavior for unified hook

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xsender' }),
}));

vi.mock('../lib/contract', () => ({
  getPendingBySender: vi.fn(),
  getPendingByRecipient: vi.fn(),
}));

// Mock ethers for event sourcing tests
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: class {
      constructor() {}
    },
  },
}));

// Mock SupplyChain factory for event sourcing
const mockQueryFilter = vi.fn();
const mockGetTransfer = vi.fn();
const mockGetToken = vi.fn();

vi.mock('../types/factories/SupplyChain__factory', () => ({
  SupplyChain__factory: {
    connect: () => ({
      filters: { TransferRequested: () => 'filter' },
      queryFilter: mockQueryFilter,
      getTransfer: mockGetTransfer,
      getToken: mockGetToken,
    }),
  },
}));

// Helper test component to exercise the hook
function TestComp({ includeAllStatuses = false }: { includeAllStatuses?: boolean }) {
  const { items, total } = useTransfersList({
    mode: 'sender',
    address: '0xsender',
    pageSize: 5,
    includeAllStatuses,
  });
  return (
    <div>
      <div data-testid="items-count">{items?.length ?? -1}</div>
      <div data-testid="total">{total ?? -1}</div>
    </div>
  );
}

describe('useTransfersList (unified hook)', () => {
  it('pending-only mode delegates to SC paginated getter (RED)', async () => {
    const { getPendingBySender } = await import('../lib/contract');
    (getPendingBySender as any).mockResolvedValueOnce({
      items: [
        {
          id: 't1',
          tokenId: 1,
          tokenName: 'Wheat',
          amount: 2,
          from: '0xsender',
          to: '0xA',
          status: 'Pending',
          createdAt: 1,
        },
      ],
      total: 1,
    });

    render(<TestComp includeAllStatuses={false} />);

    await waitFor(() => {
      // When unified hook exists and calls SC getter, we should see counts 1/1
      const itemsCount = screen.getByTestId('items-count');
      const total = screen.getByTestId('total');
      expect(itemsCount.textContent).toBe('1');
      expect(total.textContent).toBe('1');
    });
  });

  it('all-statuses mode queries events and enriches', async () => {
    // Setup mocks for event sourcing path
    mockQueryFilter.mockResolvedValueOnce([
      {
        args: {
          transferId: 1n,
          from: '0xsender',
          to: '0xB',
        },
      },
    ]);

    mockGetTransfer.mockResolvedValueOnce({
      tokenId: 5n,
      amount: 3n,
      from: '0xsender',
      to: '0xB',
      status: 1n, // Accepted
      dateCreated: 2000n,
    });

    mockGetToken.mockResolvedValueOnce({ name: 'Corn' });

    render(<TestComp includeAllStatuses={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
      expect(screen.getByTestId('total')).toHaveTextContent('1');
    });
  });
});
