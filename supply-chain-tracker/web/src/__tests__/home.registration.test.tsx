import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../pages/Home';

// Mock useWallet and contract helpers
vi.mock('../hooks/useWallet');
vi.mock('../lib/contract');

import { useWallet } from '../hooks/useWallet';
import * as contract from '../lib/contract';
import { UserRole, UserStatus } from '../lib/enums';

describe('Home page registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('shows connect CTA if not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      address: null,
      isConnected: false,
      chainId: null,
      networkName: null,
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    });
    render(<Home />);
    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });


  it('shows role request form if connected and no role', async () => {
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
    vi.mocked(contract.getUserInfo).mockResolvedValue({ role: null, status: null });

    render(<Home />);
    expect(await screen.findByLabelText(/select role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request role/i })).toBeInTheDocument();
  });


  it('shows current user status if already requested', async () => {
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
    vi.mocked(contract.getUserInfo).mockResolvedValue({ role: UserRole.Producer, status: UserStatus.Pending });

    render(<Home />);
    expect(await screen.findByText(/status: pending/i)).toBeInTheDocument();
  });


  it('shows error if contract call fails', async () => {
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
    vi.mocked(contract.getUserInfo).mockRejectedValue(new Error('Contract error'));

    render(<Home />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
