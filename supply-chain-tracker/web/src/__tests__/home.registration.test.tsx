import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../pages/Home'

// Mock useWallet and contract helpers
vi.mock('../hooks/useWallet')
vi.mock('../lib/contract')

import type { UseWalletReturn } from '../hooks/useWallet'
import { useWallet } from '../hooks/useWallet'
import * as contract from '../lib/contract'
import { UserRole, UserStatus } from '../lib/enums'

// Helper to create mock wallet state with defaults
function createMockWalletState(overrides?: Partial<UseWalletReturn>): UseWalletReturn {
  return {
    address: null,
    isConnected: false,
    chainId: null,
    networkName: null,
    connect: vi.fn(),
    getBalance: vi.fn(),
    switchNetwork: vi.fn(),
    getCurrentNetwork: vi.fn(),
    ...overrides,
  }
}

// Helper to render with router context
function renderWithRouter(component: React.ReactElement) {
  return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('Home page registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows connect CTA if not connected', () => {
    vi.mocked(useWallet).mockReturnValue(createMockWalletState())
    renderWithRouter(<Home />)
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
  })

  it('shows role request form if connected and no role', async () => {
    vi.mocked(useWallet).mockReturnValue(
      createMockWalletState({
        address: '0x123',
        isConnected: true,
        chainId: 31337,
        networkName: 'anvil',
      })
    )
    vi.mocked(contract.getUserInfo).mockResolvedValue({ role: null, status: null })

    renderWithRouter(<Home />)
    expect(await screen.findByLabelText(/select role/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request role/i })).toBeInTheDocument()
  })

  it('shows current user status if already requested', async () => {
    vi.mocked(useWallet).mockReturnValue(
      createMockWalletState({
        address: '0x123',
        isConnected: true,
        chainId: 31337,
        networkName: 'anvil',
      })
    )
    vi.mocked(contract.getUserInfo).mockResolvedValue({
      role: UserRole.Producer,
      status: UserStatus.Pending,
    })

    renderWithRouter(<Home />)
    expect(await screen.findByText(/status: pending/i)).toBeInTheDocument()
  })

  it('shows dashboard link when user has a role', async () => {
    vi.mocked(useWallet).mockReturnValue(
      createMockWalletState({
        address: '0x123',
        isConnected: true,
        chainId: 31337,
        networkName: 'anvil',
      })
    )
    vi.mocked(contract.getUserInfo).mockResolvedValue({
      role: UserRole.Producer,
      status: UserStatus.Approved,
    })

    renderWithRouter(<Home />)
    expect(await screen.findByText(/role: producer/i)).toBeInTheDocument()
    const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('shows error if contract call fails', async () => {
    vi.mocked(useWallet).mockReturnValue(
      createMockWalletState({
        address: '0x123',
        isConnected: true,
        chainId: 31337,
        networkName: 'anvil',
      })
    )
    vi.mocked(contract.getUserInfo).mockRejectedValue(new Error('Contract error'))

    renderWithRouter(<Home />)
    expect(await screen.findByText(/error/i)).toBeInTheDocument()
  })

  it('redirects admin users to /admin/users automatically', async () => {
    // Spy on window.location.href setter
    const locationAssignSpy = vi.fn()
    delete (window as any).location
    ;(window as any).location = { href: '', assign: locationAssignSpy }

    vi.mocked(useWallet).mockReturnValue(
      createMockWalletState({
        address: '0xADMIN',
        isConnected: true,
        chainId: 31337,
        networkName: 'anvil',
      })
    )
    vi.mocked(contract.getUserInfo).mockResolvedValue({
      role: UserRole.Admin,
      status: UserStatus.Approved,
    })

    renderWithRouter(<Home />)

    // Wait for the redirect to happen
    await waitFor(
      () => {
        expect(window.location.href).toBe('/admin/users')
      },
      { timeout: 2000 }
    )
  })
})
