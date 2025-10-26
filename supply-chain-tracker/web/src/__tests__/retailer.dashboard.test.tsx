import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

// Mock hooks
vi.mock('../hooks/useWallet');
vi.mock('../hooks/useUserInfo');
vi.mock('../components/tokenOps/PackageProducts', () => ({
  default: () => <div data-testid="package-products">Package Products Component</div>,
}));
vi.mock('../components/tokenOps/TransferToConsumer', () => ({
  default: () => <div data-testid="transfer-to-consumer">Transfer To Consumer Component</div>,
}));

import { useUserInfo } from '../hooks/useUserInfo';
import type { UseWalletReturn } from '../hooks/useWallet';
import { useWallet } from '../hooks/useWallet';
import { UserRole, UserStatus } from '../lib/enums';

function createMockWalletState(overrides?: Partial<UseWalletReturn>): UseWalletReturn {
  return {
    address: '0x123',
    isConnected: true,
    chainId: 31337,
    networkName: 'anvil',
    connect: vi.fn(),
    getBalance: vi.fn(),
    switchNetwork: vi.fn(),
    getCurrentNetwork: vi.fn(),
    ...overrides,
  };
}

describe('Retailer Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Retailer dashboard with proper components', async () => {
    vi.mocked(useWallet).mockReturnValue(createMockWalletState());
    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: UserRole.Retailer, status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    
    // Check for Retailer dashboard heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /retailer dashboard/i })).toBeInTheDocument();
    });

    // Check for PackageProducts component
    expect(screen.getByTestId('package-products')).toBeInTheDocument();
    
    // Check for TransferToConsumer component
    expect(screen.getByTestId('transfer-to-consumer')).toBeInTheDocument();
    
    // Check for MyTokens section
    expect(screen.getByText(/my tokens/i)).toBeInTheDocument();
    
    // Check for Transfers sections
    expect(screen.getByRole('heading', { name: /incoming transfers/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /outgoing transfers/i })).toBeInTheDocument();
  });
});