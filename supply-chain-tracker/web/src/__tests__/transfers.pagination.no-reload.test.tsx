import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../hooks/useTransfersList', () => ({
  useTransfersList: () => ({
    items: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      tokenId: 100 + i,
      tokenName: `Item ${i + 1}`,
      amount: 10 + i,
      to: '0xB',
      status: 'Pending',
    })),
    total: 7,
    page: 1,
    totalPages: 2,
    setPage: vi.fn(),
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xproducer' }),
}));

describe('Transfers pagination – no page reload on click', () => {
  it('Prev/Next clicks do not submit enclosing forms (no page reload)', async () => {
    const onSubmit = vi.fn((e: any) => e.preventDefault());

    const PendingTransfersSent = (await import('../components/tokenOps/PendingTransfersSent'))
      .default;

    render(
      <form onSubmit={onSubmit}>
        <PendingTransfersSent showAllStatuses={true} />
      </form>
    );

    // On page 1 of 2, Next should be enabled
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeEnabled();

    const user = userEvent.setup();
    await user.click(nextBtn);

    // Assert the enclosing form did not submit (click should not trigger page reload)
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
