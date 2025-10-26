import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TransferToConsumer from '../components/tokenOps/TransferToConsumer';

// Mock hooks and contract functions
vi.mock('../hooks/useWallet');
vi.mock('../hooks/useContractEvent');
vi.mock('../lib/contract');
vi.mock('../lib/utils', () => ({
  isValidAddress: (address: string) => address.startsWith('0x') && address.length === 42,
}));

import { useWallet } from '../hooks/useWallet';
import { useContractEvent } from '../hooks/useContractEvent';
import {
  getTokenDetails,
  getUserTokensWithBalance,
  transferToken,
} from '../lib/contract';

describe('TransferToConsumer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue({
      address: '0x123',
      isConnected: true,
      chainId: 31337,
      networkName: 'anvil',
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });
    vi.mocked(useContractEvent).mockImplementation(({ listener }) => {
      // Store the listener for manual triggering in tests
      (global as any).transferRequestedListener = listener;
      return { removeListener: vi.fn() };
    });
  });

  it.skip('should display loading state while fetching tokens', async () => {
    // Mock getUserTokensWithBalance to return a promise that doesn't resolve immediately
    vi.mocked(getUserTokensWithBalance).mockReturnValue(new Promise(() => {}));

    render(<TransferToConsumer />);

    // Click to open the card
    await userEvent.setup().click(screen.getByText('Transfer to Consumer'));

    // Should show loading state
    expect(screen.getByText(/loading tokens/i)).toBeInTheDocument();
  });

  it.skip('should display message when no eligible tokens are available', async () => {
    // Mock getUserTokensWithBalance to return empty array
    vi.mocked(getUserTokensWithBalance).mockResolvedValue([]);

    render(<TransferToConsumer />);

    // Click to open the card
    await userEvent.setup().click(screen.getByText('Transfer to Consumer'));

    // Should show no tokens message
    await waitFor(() => {
      expect(screen.getByText(/no packaged tokens with balance available/i)).toBeInTheDocument();
    });
  });

  it.skip('should display token selection when tokens are available', async () => {
    // Mock getUserTokensWithBalance to return token IDs
    vi.mocked(getUserTokensWithBalance).mockResolvedValue([1, 2]);
    
    // Mock getTokenDetails to return token details
    vi.mocked(getTokenDetails).mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({
          id: 1,
          name: 'Packaged Product 1',
          balance: 10,
          parentId: 5, // parentId > 0 for packaged products
          features: '{}',
          totalSupply: 10,
        });
      }
      if (id === 2) {
        return Promise.resolve({
          id: 2,
          name: 'Packaged Product 2',
          balance: 5,
          parentId: 6, // parentId > 0 for packaged products
          features: '{}',
          totalSupply: 5,
        });
      }
      return Promise.resolve(null);
    });

    render(<TransferToConsumer />);

    // Click to open the card
    await userEvent.setup().click(screen.getByText('Transfer to Consumer'));

    // Should show token selection
    await waitFor(() => {
      expect(screen.getByLabelText(/select token/i)).toBeInTheDocument();
      expect(screen.getByText(/packaged product 1 \(balance: 10\)/i)).toBeInTheDocument();
      expect(screen.getByText(/packaged product 2 \(balance: 5\)/i)).toBeInTheDocument();
    });
  });

  it.skip('should display form validation errors', async () => {
    // Mock getUserTokensWithBalance to return token IDs
    vi.mocked(getUserTokensWithBalance).mockResolvedValue([1]);
    
    // Mock getTokenDetails to return token details
    vi.mocked(getTokenDetails).mockResolvedValue({
      id: 1,
      name: 'Packaged Product 1',
      balance: 10,
      parentId: 5, // parentId > 0 for packaged products
      features: '{}',
      totalSupply: 10,
    });

    const user = userEvent.setup();
    render(<TransferToConsumer />);

    // Click to open the card
    await user.click(screen.getByText('Transfer to Consumer'));

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/consumer address/i)).toBeInTheDocument();
    });

    // Try to submit with invalid address
    await user.type(screen.getByLabelText(/consumer address/i), 'invalid-address');
    await user.type(screen.getByLabelText(/amount/i), '5');
    await user.click(screen.getByRole('button', { name: /transfer/i }));

    // Should show invalid address error
    expect(screen.getByText(/invalid destination address/i)).toBeInTheDocument();

    // Clear and try with valid address but invalid amount
    await user.clear(screen.getByLabelText(/consumer address/i));
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/consumer address/i), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByLabelText(/amount/i), '20'); // More than balance
    await user.click(screen.getByRole('button', { name: /transfer/i }));

    // Should show invalid amount error
    expect(screen.getByText(/invalid amount/i)).toBeInTheDocument();
  });

  it.skip('should successfully request a transfer', async () => {
    // Mock getUserTokensWithBalance to return token IDs
    vi.mocked(getUserTokensWithBalance).mockResolvedValue([1]);
    
    // Mock getTokenDetails to return token details
    vi.mocked(getTokenDetails).mockResolvedValue({
      id: 1,
      name: 'Packaged Product 1',
      balance: 10,
      parentId: 5, // parentId > 0 for packaged products
      features: '{}',
      totalSupply: 10,
    });

    // Mock transferToken to resolve successfully
    vi.mocked(transferToken).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<TransferToConsumer />);

    // Click to open the card
    await user.click(screen.getByText('Transfer to Consumer'));

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/consumer address/i)).toBeInTheDocument();
    });

    // Fill form with valid data
    const consumerAddress = '0x1234567890123456789012345678901234567890';
    await user.type(screen.getByLabelText(/consumer address/i), consumerAddress);
    await user.type(screen.getByLabelText(/amount/i), '5');

    // Submit form
    await user.click(screen.getByRole('button', { name: /transfer/i }));

    // Should show requesting state
    expect(screen.getByText(/requesting transfer/i)).toBeInTheDocument();

    // Should call transferToken with correct parameters
    await waitFor(() => {
      expect(transferToken).toHaveBeenCalledWith({
        tokenId: 1,
        to: consumerAddress,
        amount: 5,
        requiredRole: 'Consumer',
      });
    });

    // Simulate transfer event
    if ((global as any).transferRequestedListener) {
      (global as any).transferRequestedListener('0x123', consumerAddress, '1');
    }

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/transfer requested successfully/i)).toBeInTheDocument();
    });
  });
});