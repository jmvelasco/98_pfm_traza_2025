import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as contract from '../lib/contract';

// Mocks
vi.mock('../lib/contract', () => ({
  getPendingByRecipient: vi.fn(),
  acceptTransfer: vi.fn(),
  rejectTransfer: vi.fn(),
}));
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xfactory' }),
}));

describe('PendingTransfersReceived', () => {
  it('lists pending transfers received (paginated)', async () => {
    const mockItems = [
      {
        id: 1,
        tokenId: 10,
        tokenName: 'Raw Material A',
        amount: 50,
        from: '0xproducer',
        to: '0xfactory',
        status: 'PENDING',
      },
      {
        id: 2,
        tokenId: 11,
        tokenName: 'Raw Material B',
        amount: 30,
        from: '0xproducer2',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingByRecipient.mockResolvedValue({
      items: mockItems,
      total: 3,
    });

    // This will fail because PendingTransfersReceived does not exist yet
    const { PendingTransfersReceived } = await import(
      '../components/tokenOps/PendingTransfersReceived'
    );
    render(<PendingTransfersReceived />);

    expect(await screen.findByText(/raw material a/i)).toBeInTheDocument();
    expect(screen.getByText(/raw material b/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1–2 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it.skip('accepts a transfer and updates UI', async () => {
    // TODO: implement
  });

  it.skip('rejects a transfer and updates UI', async () => {
    // TODO: implement
  });

  it.skip('handles on-chain errors gracefully (accept/reject)', async () => {
    // TODO: implement
  });

  it.skip('disables buttons while processing', async () => {
    // TODO: implement
  });

  it.skip('respects pagination after actions', async () => {
    // TODO: implement
  });

  it.skip('guards: only recipient can act', async () => {
    // TODO: implement
  });

  it.skip('factory sees both received and sent lists without interference', async () => {
    // TODO: implement
  });
});
