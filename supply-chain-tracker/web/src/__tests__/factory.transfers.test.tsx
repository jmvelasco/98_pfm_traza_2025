import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as contract from '../lib/contract';

// Mocks
vi.mock('../lib/contract', () => ({
  getPendingByRecipient: vi.fn(),
  getPendingBySender: vi.fn(),
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
    const user = userEvent.setup();
    await user.click(acceptBtn);

    await waitFor(() => expect((contract as any).acceptTransfer).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText(/raw material a/i)).not.toBeInTheDocument());
    expect(screen.getByText(/raw material b/i)).toBeInTheDocument();
  });

  it('rejects a transfer and updates UI', async () => {
    const initialItems = [
      {
        id: 3,
        tokenId: 12,
        tokenName: 'Raw Material C',
        amount: 20,
        from: '0xproducer3',
        to: '0xfactory',
        status: 'PENDING',
      },
      {
        id: 4,
        tokenId: 13,
        tokenName: 'Raw Material D',
        amount: 40,
        from: '0xproducer4',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    const afterRejectItems = [
      {
        id: 4,
        tokenId: 13,
        tokenName: 'Raw Material D',
        amount: 40,
        from: '0xproducer4',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingByRecipient
      .mockResolvedValueOnce({ items: initialItems, total: 2 })
      .mockResolvedValueOnce({ items: afterRejectItems, total: 1 });
    (contract as any).rejectTransfer.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 0))
    );

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    expect(await screen.findByText(/raw material c/i)).toBeInTheDocument();
    const rowC = screen.getByText(/raw material c/i).closest('tr')!;
    const rejectBtn = rowC.querySelector('button[name="reject"]') as HTMLButtonElement;
    expect(rejectBtn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(rejectBtn);

    await waitFor(() => expect((contract as any).rejectTransfer).toHaveBeenCalledWith(3));
    await waitFor(() => expect(screen.queryByText(/raw material c/i)).not.toBeInTheDocument());
    expect(screen.getByText(/raw material d/i)).toBeInTheDocument();
  });

  it('handles on-chain errors gracefully (accept)', async () => {
    const initialItems = [
      {
        id: 5,
        tokenId: 20,
        tokenName: 'Raw Material E',
        amount: 10,
        from: '0xproducer5',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingByRecipient.mockResolvedValue({ items: initialItems, total: 1 });
    (contract as any).acceptTransfer.mockRejectedValue(new Error('boom'));

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    const rowE = await screen.findByText(/raw material e/i);
    const acceptBtn = rowE
      .closest('tr')!
      .querySelector('button[name="accept"]') as HTMLButtonElement;
    const user = userEvent.setup();
    await user.click(acceptBtn);

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
    // List unchanged
    expect(screen.getByText(/raw material e/i)).toBeInTheDocument();
  });

  it('disables buttons while processing', async () => {
    const initialItems = [
      {
        id: 6,
        tokenId: 21,
        tokenName: 'Raw Material F',
        amount: 15,
        from: '0xproducer6',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];
    (contract as any).getPendingByRecipient.mockResolvedValue({ items: initialItems, total: 1 });
    // Keep promise pending to observe disabled state
    let resolveFn: () => void;
    (contract as any).acceptTransfer.mockImplementation(
      () => new Promise<void>((resolve) => (resolveFn = () => resolve()))
    );

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    const user = userEvent.setup();
    const rowF = await screen.findByText(/raw material f/i);
    const acceptBtn = rowF
      .closest('tr')!
      .querySelector('button[name="accept"]') as HTMLButtonElement;
    expect(acceptBtn).toBeInTheDocument();
    expect(acceptBtn).not.toBeDisabled();

    await user.click(acceptBtn);
    expect(acceptBtn).toBeDisabled();

    // Now resolve and ensure cleanup happens
    resolveFn!();
    await waitFor(() => expect((contract as any).acceptTransfer).toHaveBeenCalledWith(6));
  });

  it('respects pagination after actions', async () => {
    // Page 1: 5 items of 6 total
    const page1Items = [1, 2, 3, 4, 5].map((i) => ({
      id: i,
      tokenId: 100 + i,
      tokenName: `Item ${i}`,
      amount: 10,
      from: `0xprod${i}`,
      to: '0xfactory',
      status: 'PENDING',
    }));
    const page2Items = [
      {
        id: 6,
        tokenId: 106,
        tokenName: 'Item 6',
        amount: 10,
        from: '0xprod6',
        to: '0xfactory',
        status: 'PENDING',
      },
    ];

    (contract as any).getPendingByRecipient
      .mockResolvedValueOnce({ items: page1Items, total: 6 }) // initial load page 1
      .mockResolvedValueOnce({ items: page2Items, total: 6 }) // after clicking Next
      .mockResolvedValueOnce({ items: [], total: 5 }) // after accepting last item on page 2 (offset beyond total)
      .mockResolvedValueOnce({ items: page1Items, total: 5 }); // after hook adjusts page back

    (contract as any).acceptTransfer.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 0))
    );

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    // We are at page 1
    expect(await screen.findByText(/item 1/i)).toBeInTheDocument();
    // Go to page 2
    const nextBtn = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);
    expect(await screen.findByText(/item 6/i)).toBeInTheDocument();

    // Accept the only item on page 2
    const row = screen.getByText(/item 6/i).closest('tr')!;
    const acceptBtn = row.querySelector('button[name="accept"]') as HTMLButtonElement;
    await userEvent.click(acceptBtn);

    // After accept, list should adjust back to page 1 showing items 1..5, total=5 and no Next button enabled
    await waitFor(() => expect(screen.getByText(/item 1/i)).toBeInTheDocument());
    // Optional: check page label
    expect(screen.getByText(/page 1 /i)).toBeInTheDocument();
  });

  it('guards: only recipient can act', async () => {
    // Wallet mocked as 0xfactory globally; return an item addressed to someone else
    (contract as any).getPendingByRecipient.mockResolvedValue({
      items: [
        {
          id: 7,
          tokenId: 130,
          tokenName: 'Alien Item',
          amount: 1,
          from: '0xprodX',
          to: '0xnotfactory',
          status: 'PENDING',
        },
      ],
      total: 1,
    });

    const PendingTransfersReceived = (
      await import('../components/tokenOps/PendingTransfersReceived')
    ).default;
    render(<PendingTransfersReceived />);

    // Row renders but no actions should be available
    expect(await screen.findByText(/alien item/i)).toBeInTheDocument();
    const row = screen.getByText(/alien item/i).closest('tr')!;
    expect(row.querySelector('button[name="accept"]')).toBeNull();
    expect(row.querySelector('button[name="reject"]')).toBeNull();
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

  it('renders Sent (outgoing) pending transfers in read-only mode', async () => {
    (contract as any).getPendingBySender.mockResolvedValue({
      items: [
        {
          id: 's1',
          tokenId: 300,
          tokenName: 'S1',
          amount: 5,
          to: '0xret',
          from: '0xfactory',
          status: 'PENDING',
        },
      ],
      total: 1,
    });

    const PendingTransfersSent = (await import('../components/tokenOps/PendingTransfersSent'))
      .default;
    render(<PendingTransfersSent />);
    expect(await screen.findByRole('heading', { name: /outgoing transfers/i })).toBeInTheDocument();
    expect(screen.getByText(/s1/i)).toBeInTheDocument();
    // No action buttons expected
    const row = screen.getByText(/s1/i).closest('tr')!;
    expect(row.querySelector('button[name="accept"]')).toBeNull();
    expect(row.querySelector('button[name="reject"]')).toBeNull();
  });
});
