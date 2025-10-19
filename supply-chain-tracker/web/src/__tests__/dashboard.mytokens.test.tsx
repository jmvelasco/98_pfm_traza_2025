import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as contractModule from '../lib/contract';
import Dashboard from '../pages/Dashboard';

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

const mockTokenDetails = {
  id: 1,
  creator: '0x123',
  name: 'Wheat',
  totalSupply: 100,
  features: '{"country":"Spain","type":"raw"}',
  parentId: 0,
  dateCreated: 1700000000,
  balance: 100,
};

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
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([1]);
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(mockTokenDetails);

    // Act: Render dashboard
    render(<Dashboard />);

    // Assert: MyTokens section should show the token
    expect(screen.getByText('My Tokens')).toBeInTheDocument();
    expect(await screen.findByText(/Wheat/i)).toBeInTheDocument();
    expect(screen.getByText(/Spain/i)).toBeInTheDocument();
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
    vi.mocked(contractModule.getUserTokens).mockResolvedValue([]);

    // Act: Render dashboard
    render(<Dashboard />);

    // Assert: Should show empty state
    expect(screen.getByText('My Tokens')).toBeInTheDocument();
    expect(await screen.findByText(/no tokens found/i)).toBeInTheDocument();
  });
});
