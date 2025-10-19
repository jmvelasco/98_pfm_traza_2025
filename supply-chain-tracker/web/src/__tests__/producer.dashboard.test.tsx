
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

describe('Producer Dashboard', () => {
  test('shows Create Raw Material action and triggers mint logic', async () => {
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

    // Arrange: Render dashboard
    render(<Dashboard />);

    // Act: Find and click the action
    const createButton = screen.getByRole('button', { name: /Create Raw Material/i });
    expect(createButton).toBeInTheDocument();
    userEvent.click(createButton);

    // Assert: Expect minting logic to be triggered (placeholder, RED phase)
    expect(await screen.findByText(/Minting raw material.../i)).toBeInTheDocument();
  });
});
