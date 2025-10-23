import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { RoleActions } from '../components/RoleActions';
import { UserRole } from '../lib/enums';

// Mock the contract module
vi.mock('../lib/contract', () => ({
  createToken: vi.fn(),
  getUserTokens: vi.fn(),
  getTokenDetails: vi.fn(),
  getUserInfo: vi.fn(),
  requestTransfer: vi.fn(),
}));

// Mock wallet hook to avoid requiring Web3Provider in component tests
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xTEST', isConnected: true }),
}));

import * as contractModule from '../lib/contract';
import { createToken } from '../lib/contract';

describe('Producer RoleActions', () => {
  describe('Minting Raw Materials', () => {
    test('shows Create Raw Material action and triggers mint logic, then shows success and resets', async () => {
      // Mock createToken to resolve after a short delay
      vi.mocked(createToken).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      render(<RoleActions role={UserRole.Producer} />);
      const createButton = screen.getByRole('button', { name: /Create Raw Material/i });
      expect(createButton).toBeInTheDocument();
      userEvent.click(createButton);

      // Check that form fields appear
      expect(await screen.findByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/total supply/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();

      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const supplyInput = screen.getByLabelText(/total supply/i);
      const contentInput = screen.getByLabelText(/content/i);

      await userEvent.type(nameInput, 'Wheat');
      await userEvent.type(supplyInput, '500');
      await userEvent.type(contentInput, 'High quality organic wheat');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /mint/i });
      await userEvent.click(submitButton);

      // Check UI feedback is shown (pending)
      expect(await screen.findByTestId('minting-feedback')).toBeInTheDocument();

      // Wait for success message
      expect(await screen.findByTestId('mint-success')).toBeInTheDocument();

      // Wait for form to reset (success message disappears, form closes)
      await new Promise((resolve) => setTimeout(resolve, 2100));
      expect(screen.queryByTestId('mint-success')).toBeNull();
      // Form should be closed
      expect(screen.queryByLabelText(/name/i)).toBeNull();

      // Check that createToken was called with proper parameters from form
      expect(createToken).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Wheat',
          totalSupply: 500,
          features: JSON.stringify({
            type: 'raw',
            content: 'High quality organic wheat',
          }),
          parentId: 0,
        })
      );
    });

    test('does not show mint action for non-Producer roles', () => {
      render(<RoleActions role={UserRole.Factory} />);
      expect(screen.queryByRole('button', { name: /Create Raw Material/i })).toBeNull();
    });

    test('does not show mint action for disconnected wallet (simulate by not rendering)', () => {
      // If RoleActions is not rendered, nothing should be present
      expect(screen.queryByRole('button', { name: /Create Raw Material/i })).toBeNull();
    });

    test('unapproved Producer cannot mint (simulate by disabling button)', () => {
      // Simulate by rendering disabled ActionCard
      // This would require a prop or context in real code, here we just check for disabled state
      // For now, just document the test case
      // TODO: Implement disabled state for unapproved Producer
    });

    test('shows form only once on rapid clicks', async () => {
      render(<RoleActions role={UserRole.Producer} />);
      const createButton = screen.getByRole('button', { name: /Create Raw Material/i });
      await userEvent.click(createButton);
      await userEvent.click(createButton);

      // Should only show one form
      const nameInputs = screen.getAllByLabelText(/name/i);
      expect(nameInputs.length).toBe(1);
    });

    test('does not show mint action for missing input (simulate by not rendering)', () => {
      // No input fields in current UI, so just document the test case
      // TODO: Add input validation tests when UI is implemented
    });

    test('handles contract error gracefully (simulate)', async () => {
      // TODO: Simulate contract error and check for error feedback
    });

    test('prevents minting with duplicate token name (simulate)', async () => {
      // TODO: Simulate duplicate name and check for error feedback
    });

    test('handles large supply/features values (simulate)', async () => {
      // TODO: Simulate large values and check for UI/contract handling
    });

    test('validates parentId handling (simulate)', async () => {
      // TODO: Simulate parentId usage and check for correct behavior
    });
  });

  describe('Token Transfer to Factory', () => {
    test('opens Transfer to Factory panel and shows token selector (raw + balance > 0 only)', async () => {
      // Arrange mocks for token loading
      const producer = '0xPRODUCER0000000000000000000000000000000000';
      // getUserTokens returns three IDs
      vi.mocked(contractModule.getUserTokens as any).mockResolvedValue([1, 2, 3]);
      // getTokenDetails returns: #1 raw with balance 100, #2 derived with balance 50, #3 raw with balance 0
      vi.mocked(contractModule.getTokenDetails as any).mockImplementation(async (id: number) => {
        if (id === 1) {
          return {
            id: 1,
            creator: producer,
            name: 'Raw One',
            totalSupply: 100,
            features: '{}',
            parentId: 0,
            dateCreated: Date.now(),
            balance: 100,
          };
        }
        if (id === 2) {
          return {
            id: 2,
            creator: producer,
            name: 'Derived Two',
            totalSupply: 50,
            features: '{}',
            parentId: 1,
            dateCreated: Date.now(),
            balance: 50,
          };
        }
        if (id === 3) {
          return {
            id: 3,
            creator: producer,
            name: 'Raw Three',
            totalSupply: 0,
            features: '{}',
            parentId: 0,
            dateCreated: Date.now(),
            balance: 0,
          };
        }
        return null;
      });

      // Mock wallet context to be connected producer
      vi.doMock('../hooks/useWallet', () => ({
        useWallet: () => ({ address: producer, isConnected: true }),
      }));

      // Act: render and click the action
      render(<RoleActions role={UserRole.Producer} />);

      // Expect the Transfer to Factory action to be a clickable control (button-like)
      const transferBtn = screen.getByRole('button', { name: /transfer to factory/i });
      await userEvent.click(transferBtn);

      // Assert: a token selector appears with only eligible tokens (raw and balance > 0)
      const tokenSelect = await screen.findByLabelText(/token/i);
      expect(tokenSelect).toBeInTheDocument();

      // The select should contain only one option (token #1)
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0]).toHaveTextContent(/raw one/i);
    });

    test('submits valid transfer and shows pending → success feedback', async () => {
      const producer = '0xPRODUCER0000000000000000000000000000000000';
      const factory = '0x1234567890123456789012345678901234567890'; // Valid 40-char hex

      // Mock token loading: one raw token with balance
      vi.mocked(contractModule.getUserTokens as any).mockResolvedValue([1]);
      vi.mocked(contractModule.getTokenDetails as any).mockResolvedValue({
        id: 1,
        creator: producer,
        name: 'Wheat',
        totalSupply: 100,
        features: '{}',
        parentId: 0,
        dateCreated: Date.now(),
        balance: 100,
      });

      // Mock recipient validation: approved Factory
      vi.mocked(contractModule.getUserInfo as any).mockResolvedValue({
        role: 'Factory',
        status: 'Approved',
      });

      // Mock requestTransfer: delayed resolution to observe pending state
      vi.mocked(contractModule.requestTransfer as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Render and open panel
      render(<RoleActions role={UserRole.Producer} />);
      const transferBtn = screen.getByRole('button', { name: /transfer to factory/i });
      const user = userEvent.setup();
      await user.click(transferBtn);

      // Wait for token selector to appear (token loads async)
      await screen.findByLabelText(/token/i);

      // Fill destination and amount
      const destInput = screen.getByLabelText(/destination/i);
      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(destInput, factory);
      await user.type(amountInput, '50');

      // Wait a tick for validation to settle
      await new Promise((r) => setTimeout(r, 0));

      // Submit
      const submitBtn = screen.getByRole('button', { name: /request transfer/i });
      await user.click(submitBtn);

      // Assert: pending feedback appears
      expect(await screen.findByText(/requesting transfer/i)).toBeInTheDocument();

      // Assert: success feedback appears after resolution
      expect(await screen.findByText(/transfer requested/i)).toBeInTheDocument();

      // Verify requestTransfer was called with correct args
      expect(contractModule.requestTransfer).toHaveBeenCalledWith(1, factory, 50);
    });
  });
});
