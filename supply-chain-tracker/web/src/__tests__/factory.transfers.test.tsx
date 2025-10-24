import { render, screen, waitFor } from '@testing-library/react';
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

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    expect(await screen.findByText(/raw material a/i)).toBeInTheDocument();
    expect(screen.getByText(/raw material b/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1–2 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('accepts a transfer and updates UI', async () => {
    const initialItems = [
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
    const afterAcceptItems = [
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
    (contract as any).getPendingByRecipient
      .mockResolvedValueOnce({ items: initialItems, total: 2 })
      .mockResolvedValueOnce({ items: afterAcceptItems, total: 1 });
    (contract as any).acceptTransfer.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 0))
    );

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    expect(await screen.findByText(/raw material a/i)).toBeInTheDocument();

    // Click Accept on row A
    const rowA = screen.getByText(/raw material a/i).closest('tr')!;
    const acceptBtn = rowA.querySelector('button[name="accept"]') as HTMLButtonElement;
    expect(acceptBtn).toBeInTheDocument();
    acceptBtn.click();

    await waitFor(() => expect((contract as any).acceptTransfer).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText(/raw material a/i)).not.toBeInTheDocument());
    expect(screen.getByText(/raw material b/i)).toBeInTheDocument();
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
