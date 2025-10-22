import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Users from '../pages/admin/Users'

vi.mock('../hooks/useWallet', () => ({
  useWallet: vi.fn(),
}))

vi.mock('../hooks/useUserInfo', () => ({
  useUserInfo: vi.fn(),
}))

vi.mock('../lib/contract', () => ({
  changeStatusUser: vi.fn(),
  getUserInfo: vi.fn(),
  getUsers: vi.fn(),
}))

import { useUserInfo } from '../hooks/useUserInfo'
import { useWallet } from '../hooks/useWallet'
import { changeStatusUser, getUsers } from '../lib/contract'
import { UserStatus } from '../lib/enums'

describe('Admin Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('denies access to non-admin users', () => {
    vi.mocked(useWallet).mockReturnValue({
      address: '0xUser',
      isConnected: true,
      chainId: 31337,
      networkName: 'Anvil',
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    } as any)

    // Non-admin user info
    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: 'Producer', status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    )

    expect(screen.getByText(/Acceso restringido a administradores/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Dirección de usuario/i)).not.toBeInTheDocument()
  })

  it('lists users with different statuses (pending and approved)', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: '0xAdmin',
      isConnected: true,
      chainId: 31337,
      networkName: 'Anvil',
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    } as any)

    // Current user is Admin
    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: 'Admin', status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    const users = [
      {
        address: '0x1111111111111111111111111111111111111111',
        role: 'Producer',
        status: UserStatus.Pending,
      },
      {
        address: '0x2222222222222222222222222222222222222222',
        role: 'Factory',
        status: UserStatus.Approved,
      },
      {
        address: '0x3333333333333333333333333333333333333333',
        role: 'Retailer',
        status: UserStatus.Rejected,
      },
    ]
    vi.mocked(getUsers).mockResolvedValue(users as any)
    vi.mocked(changeStatusUser).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    )

    // Should list all users with different statuses
    expect(
      await screen.findByText('0x1111111111111111111111111111111111111111')
    ).toBeInTheDocument()
    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument()
    expect(screen.getByText('0x3333333333333333333333333333333333333333')).toBeInTheDocument()

    // Should show all statuses
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()

    // Approve button should be disabled for already approved user
    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i })
    expect(approveButtons[1]).toBeDisabled() // The approved user's button
    expect(approveButtons[0]).not.toBeDisabled() // The pending user's button

    // Reject button should be disabled for already rejected user
    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i })
    expect(rejectButtons[2]).toBeDisabled() // The rejected user's button
    expect(rejectButtons[0]).not.toBeDisabled() // The pending user's button
  })

  it('allows approving a pending user and refetches list', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: '0xAdmin',
      isConnected: true,
      chainId: 31337,
      networkName: 'Anvil',
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    } as any)

    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: 'Admin', status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    const initialUsers = [
      {
        address: '0x1111111111111111111111111111111111111111',
        role: 'Producer',
        status: UserStatus.Pending,
      },
    ]
    const updatedUsers = [
      {
        address: '0x1111111111111111111111111111111111111111',
        role: 'Producer',
        status: UserStatus.Approved,
      },
    ]

    vi.mocked(getUsers)
      .mockResolvedValueOnce(initialUsers as any)
      .mockResolvedValueOnce(updatedUsers as any)
    vi.mocked(changeStatusUser).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    )

    // Initially shows pending user
    expect(await screen.findByText('Pending')).toBeInTheDocument()

    // Approve the user
  const approveButton = screen.getByRole('button', { name: /Aprobar/i })
  const user = userEvent.setup()
  await user.click(approveButton)

    await waitFor(() => {
      expect(changeStatusUser).toHaveBeenCalledWith(initialUsers[0].address, UserStatus.Approved)
    })

    // After refetch, should show approved status
    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument()
    })
  })

  it('shows an error if reject action fails', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: '0xAdmin',
      isConnected: true,
      chainId: 31337,
      networkName: 'Anvil',
      connect: vi.fn(),
      getBalance: vi.fn(),
      switchNetwork: vi.fn(),
      getCurrentNetwork: vi.fn(),
    } as any)

    vi.mocked(useUserInfo).mockReturnValue({
      userInfo: { role: 'Admin', status: UserStatus.Approved },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    const pending = [
      {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        role: 'Retailer',
        status: UserStatus.Pending,
      },
    ]
    vi.mocked(getUsers).mockResolvedValue(pending as any)
    vi.mocked(changeStatusUser).mockRejectedValue(new Error('tx failed'))

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    )

  // Click Reject on the only row
  const user = userEvent.setup()
  const rejectBtn = await screen.findByRole('button', { name: /Rechazar/i })
  await user.click(rejectBtn)
    expect(await screen.findByText(/Error al actualizar estado/i)).toBeInTheDocument()
  })
})
