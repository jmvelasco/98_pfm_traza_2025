import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransferForm } from '../components/tokenOps/TransferToRetailer';
import * as contract from '../lib/contract';

// Mocks
vi.mock('../lib/contract', () => ({
  getUserInfo: vi.fn(),
  requestTransfer: vi.fn(),
  getUserTokensWithBalance: vi.fn(),
  getTokenDetails: vi.fn(),
}));
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xfactory' }),
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

describe('TransferForm (Factory)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form and validates basic fields', () => {
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request transfer/i })).toBeDisabled();
  });

  it('blocks transfer of raw material tokens (parentId = 0)', () => {
    render(<TransferForm tokenId={2} parentId={0} balance={100} />);
    expect(
      screen.getByText(/raw material tokens cannot be transferred by factory/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request transfer/i })).not.toBeInTheDocument();
  });

  it('requires Retailer approved recipient', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Factory', status: 'Approved' });
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '10');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    expect(await screen.findByText(/recipient must be an approved retailer/i)).toBeInTheDocument();
  });

  it('validates amount is greater than 0', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument();
  });

  it('validates amount does not exceed balance', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '150');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    expect(await screen.findByText(/insufficient balance/i)).toBeInTheDocument();
  });

  it('calls requestTransfer with correct parameters on submit', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    (contract as any).requestTransfer.mockResolvedValue(undefined);
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    await waitFor(() => {
      expect(contract.requestTransfer).toHaveBeenCalledWith(1, '0x1111111111111111111111111111111111111111', 50);
    });
  });

  it('surfaces contract errors with user-visible messages', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    (contract as any).requestTransfer.mockRejectedValue(new Error('Transaction failed'));
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    expect(await screen.findByText(/transaction failed/i)).toBeInTheDocument();
  });

  it('clears form after successful TransferRequested event', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    (contract as any).requestTransfer.mockResolvedValue(undefined);
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    
    // Simulate TransferRequested event
    const handler = factoryMock.getListener();
    expect(handler).toBeTruthy();
    await act(async () => {
      await handler({ args: { from: '0xfactory' } });
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/destination/i)).toHaveValue('');
      expect(screen.getByLabelText(/amount/i)).toHaveValue('');
    });
  });

  it('disables controls during submission', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    (contract as any).requestTransfer.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    
    expect(screen.getByLabelText(/destination/i)).toBeDisabled();
    expect(screen.getByLabelText(/amount/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /requesting…/i })).toBeDisabled();
  });

  it('shows success message after transfer request', async () => {
    (contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' });
    (contract as any).requestTransfer.mockResolvedValue(undefined);
    render(<TransferForm tokenId={1} parentId={1} balance={100} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/destination/i),
      '0x1111111111111111111111111111111111111111'
    );
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /request transfer/i }));
    expect(await screen.findByText(/transfer requested/i)).toBeInTheDocument();
  });
});
