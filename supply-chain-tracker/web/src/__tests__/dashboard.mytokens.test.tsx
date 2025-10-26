import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as contractModule from '../lib/contract';
import Dashboard from '../pages/Dashboard';
import { buildToken } from './utils/builders';

// Mock hooks
vi.mock('../hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

vi.mock('../hooks/useUserInfo', () => ({
  useUserInfo: vi.fn(),
}));

// Mock contract module
vi.mock('../lib/contract', () => ({
  getUserTokens: vi.fn(),
  getUserTokensWithBalance: vi.fn(),
  getTokenDetails: vi.fn(),
  createToken: vi.fn(),
}));

// Mock Web3Provider context
vi.mock('../contexts/Web3Provider', () => ({
  useWeb3: () => ({
    contract: {},
    provider: {},
  }),
}));

import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { UserRole, UserStatus } from '../lib/enums';

const mockTokenDetails = buildToken({
  id: 1,
  creator: '0x123',
  name: 'Wheat',
  features: '{"country":"Spain","type":"raw"}',
});

describe('Dashboard - MyTokens Integration (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays MyTokens component in the My Tokens section', async () => {
    // Arrange: Mock connected Producer user with tokens
    vi.mocked(useWallet).mockReturnValue({
      address: '0x123',
      isConnected: true,
      chainId: null,
      networkName: null,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });

    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: UserRole.Producer, status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock contract to return a token
    vi.mocked(contractModule.getUserTokensWithBalance).mockResolvedValue([1]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    // Act: Render dashboard
    render(<Dashboard />);

    // Assert: MyTokens section should show the token
    await waitFor(() => {
      expect(screen.getByText('My Tokens')).toBeInTheDocument();
      expect(screen.getByText(/Wheat/i)).toBeInTheDocument();
      expect(screen.getByText(/Spain/i)).toBeInTheDocument();
    });
  });

  it('shows empty state in MyTokens when user has no tokens', async () => {
    // Arrange: Mock connected Producer user without tokens
    vi.mocked(useWallet).mockReturnValue({
      address: '0x123',
      isConnected: true,
      chainId: null,
      networkName: null,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });

    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: UserRole.Producer, status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock contract to return no tokens
    vi.mocked(contractModule.getUserTokensWithBalance).mockResolvedValue([]);

    // Act: Render dashboard
    render(<Dashboard />);

    // Assert: Should show empty state
    await waitFor(() => {
      expect(screen.getByText('My Tokens')).toBeInTheDocument();
      expect(screen.getByText(/no tokens yet/i)).toBeInTheDocument();
    });
  });
});
