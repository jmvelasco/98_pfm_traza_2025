import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyTokens from '../components/MyTokens';

// Mock contract and provider
vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn(),
    BrowserProvider: vi.fn(),
  };
});

const mockTokens = [
  {
    id: 1,
    creator: '0x123',
    name: 'Wheat',
    totalSupply: 100,
    features: '{"country":"Spain"}',
    parentId: 0,
    dateCreated: 1700000000,
  },
];

describe('MyTokens (TDD RED)', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('shows empty state if user owns no tokens', async () => {
    // Arrange: mock contract to return no tokens
    // ...mock getUserTokens to return []
    render(<MyTokens userAddress="0x123" />);
    expect(await screen.findByText(/no tokens/i)).toBeInTheDocument();
  });

  it('shows list of owned tokens with metadata', async () => {
    // Arrange: mock contract to return mockTokens
    // ...mock getUserTokens to return [1], getToken(1) to return mockTokens[0]
    render(<MyTokens userAddress="0x123" />);
    expect(await screen.findByText(/Wheat/i)).toBeInTheDocument();
    expect(screen.getByText(/Spain/i)).toBeInTheDocument();
  });

  it('updates UI in real time when TokenCreated event is emitted for user', async () => {
    // Arrange: mock contract to emit TokenCreated event
    render(<MyTokens userAddress="0x123" />);
    // Simulate TokenCreated event for user
    // ...simulate event
    await waitFor(() => {
      expect(screen.getByText(/Wheat/i)).toBeInTheDocument();
    });
  });

  it('does not update UI for TokenCreated events from other users', async () => {
    render(<MyTokens userAddress="0x123" />);
    // Simulate TokenCreated event for another user
    // ...simulate event
    expect(screen.queryByText(/OtherToken/i)).not.toBeInTheDocument();
  });
});
