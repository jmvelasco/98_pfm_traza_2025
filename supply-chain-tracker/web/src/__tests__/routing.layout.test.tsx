import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We'll mock the useWallet hook to control connection state
vi.mock('../hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

// Import after mock definition
import Header from '../components/layout/Header';
import { useWallet } from '../hooks/useWallet';

describe('Layout/Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Connect button when wallet is disconnected', () => {
    (useWallet as unknown as any).mockReturnValue({
      address: null,
      isConnected: false,
      chainId: null,
      networkName: null,
      connect: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /supply chain tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });
});
