import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as contract from '../lib/contract';

// Mocks
vi.mock('../lib/contract', () => ({
  getPendingByRecipient: vi.fn(),
  getPendingBySender: vi.fn(),
}));
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xfactory' }),
}));

describe('Transfers – Received List', () => {
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

  it('factory sees both received and sent lists without interference', async () => {
    // Incoming (recipient): 2 pages
    const incPage1 = [1, 2, 3, 4, 5].map((i) => ({
      id: i,
      tokenId: 200 + i,
      tokenName: `R${i}`,
      amount: 10,
      from: `0xprod${i}`,
      to: '0xfactory',
      status: 'PENDING',
    }));
    const incPage2 = [
      {
        id: 6,
        tokenId: 206,
        tokenName: 'R6',
        amount: 10,
        from: '0xprod6',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingByRecipient
      .mockResolvedValueOnce({ items: incPage1, total: 6 })
      .mockResolvedValueOnce({ items: incPage2, total: 6 });

    // Sent (sender): single page
    const sentItems = [
      {
        id: 's1',
        tokenId: 300,
        tokenName: 'S1',
        amount: 5,
        to: '0xret',
        from: '0xfactory',
        status: 'PENDING',
      },
      {
        id: 's2',
        tokenId: 301,
        tokenName: 'S2',
        amount: 7,
        to: '0xret2',
        from: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingBySender.mockResolvedValue({ items: sentItems, total: 2 });

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    const PendingTransfersSent = (await import('../components/tokenOps/PendingTransfersSent'))
      .default;

    render(
      <div>
        <PendingTransfersReceived />
        <PendingTransfersSent />
      </div>
    );

    // Both lists show their first pages
    expect(await screen.findByText(/r1/i)).toBeInTheDocument();
    expect(screen.getByText(/s1/i)).toBeInTheDocument();

    // Find Next button within Incoming section and click
    const incomingSection = screen
      .getByRole('heading', { name: /incoming transfers/i })
      .closest('section')!;
    const incomingNext = within(incomingSection).getByRole('button', { name: /next/i });
    await userEvent.click(incomingNext);

    // Incoming advanced to page 2
    expect(await screen.findByText(/r6/i)).toBeInTheDocument();
    // Sent list remains on page 1
    expect(screen.getByText(/s1/i)).toBeInTheDocument();
  });
});
