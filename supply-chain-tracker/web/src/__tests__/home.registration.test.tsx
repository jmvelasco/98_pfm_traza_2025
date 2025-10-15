import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../pages/Home';

// Mock useWallet and contract helpers
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
    connect: vi.fn(),
    getBalance: vi.fn(),
    switchNetwork: vi.fn(),
    getCurrentNetwork: vi.fn(),
  }),
}));

vi.mock('../lib/contract', () => ({
  requestUserRole: vi.fn(),
  getUserInfo: vi.fn(),
}));

describe('Home page registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows connect CTA if not connected', () => {
    render(<Home />);
    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('shows role request form if connected and no role', async () => {
    // Mock useWallet to be connected
    const useWallet = require('../hooks/useWallet').useWallet;
    useWallet.mockReturnValue({
      address: '0x123',
      isConnected: true,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });
    // Mock getUserInfo to return no role
    const getUserInfo = require('../lib/contract').getUserInfo;
    getUserInfo.mockResolvedValue({ role: null, status: null });

    render(<Home />);
    expect(await screen.findByLabelText(/select role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request role/i })).toBeInTheDocument();
  });

  it('shows current user status if already requested', async () => {
    const useWallet = require('../hooks/useWallet').useWallet;
    useWallet.mockReturnValue({
      address: '0x123',
      isConnected: true,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });
    const getUserInfo = require('../lib/contract').getUserInfo;
    getUserInfo.mockResolvedValue({ role: 'Producer', status: 'Pending' });

    render(<Home />);
    expect(await screen.findByText(/status: pending/i)).toBeInTheDocument();
  });

  it('shows error if contract call fails', async () => {
    const useWallet = require('../hooks/useWallet').useWallet;
    useWallet.mockReturnValue({
      address: '0x123',
      isConnected: true,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });
    const getUserInfo = require('../lib/contract').getUserInfo;
    getUserInfo.mockRejectedValue(new Error('Contract error'));

    render(<Home />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
