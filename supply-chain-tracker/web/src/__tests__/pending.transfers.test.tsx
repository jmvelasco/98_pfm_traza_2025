import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PendingTransfers from '../components/tokenOps/PendingTransfers';
import * as contract from '../lib/contract';

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xproducer' }),
}));

vi.mock('../lib/contract', () => ({
  getPendingTransfersBySender: vi.fn().mockResolvedValue([]),
}));

describe('PendingTransfers', () => {
  it('shows empty state when there are no pending transfers', async () => {
    render(<PendingTransfers />);
    expect(screen.getByRole('heading', { name: /Pending Transfers/i })).toBeInTheDocument();
    expect(await screen.findByText(/No pending transfers at the moment\./i)).toBeInTheDocument();
  });

  it('renders a list of pending transfers with basic fields', async () => {
    (contract as any).getPendingTransfersBySender.mockResolvedValue([
      {
        id: 'tx1',
        tokenId: 1,
        tokenName: 'Wheat',
        amount: 10,
        to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        status: 'Pending',
        createdAt: 1700000000,
      },
      {
        id: 'tx2',
        tokenId: 2,
        tokenName: null,
        amount: 5,
        to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        status: 'Pending',
        createdAt: 1700001000,
      },
    ]);

    render(<PendingTransfers />);

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
});
