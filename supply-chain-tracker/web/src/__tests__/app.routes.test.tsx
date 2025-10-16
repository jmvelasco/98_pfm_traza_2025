import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Web3Provider } from '../contexts/Web3Provider'
import AppRoutes from '../routes/AppRoutes'


describe('AppRoutes', () => {
  it('renders Home at "/" with header and Connect button when disconnected (mocked via WalletConnect)', () => {
    render(
      <Web3Provider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </Web3Provider>
    )

    // Header title link
    expect(screen.getByRole('link', { name: /supply chain tracker/i })).toBeInTheDocument()
    // Header no longer shows Admin Users link (was removed from header navigation)
    expect(screen.queryByRole('link', { name: /admin users/i })).not.toBeInTheDocument()
  })

  it('renders Admin Users page at "/admin/users"', () => {
    render(
      <Web3Provider>
        <MemoryRouter initialEntries={["/admin/users"]}>
          <AppRoutes />
        </MemoryRouter>
      </Web3Provider>
    )

    // Page title is now just "Users"
    expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument()
  })
})
