
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

describe('Producer Dashboard', () => {
  test('shows dashboard with the required actions for Producer role', async () => {
    // Mock hooks to simulate Producer role
    vi.mock('../hooks/useWallet', () => ({
      useWallet: () => ({ address: '0x123', isConnected: true })
    }));
    vi.mock('../hooks/useUserInfo', () => ({
      useUserInfo: () => ({
        userInfo: { role: 'Producer', status: 'Approved' },
        loading: false,
        error: null
      })
    }));

    // Render dashboard
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Producer Dashboard/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Raw Material/i })).toBeInTheDocument();
      expect(screen.getByText(/Register new raw materials in the system/i)).toBeInTheDocument();
      expect(screen.getByText(/Transfer to Factory/i)).toBeInTheDocument();
      expect(screen.getByText(/Send materials to processing facilities/i)).toBeInTheDocument();
    });
  });
});
