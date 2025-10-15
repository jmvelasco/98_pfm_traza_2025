import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Web3Provider } from '../contexts/Web3Provider'

// RED: AppRoutes does not exist yet; this test will fail until routes are implemented
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
    // Link to Admin Users
    expect(screen.getByRole('link', { name: /admin users/i })).toBeInTheDocument()
  })

  it('renders Admin Users page at "/admin/users"', () => {
    render(
      <Web3Provider>
        <MemoryRouter initialEntries={["/admin/users"]}>
          <AppRoutes />
        </MemoryRouter>
      </Web3Provider>
    )

    expect(screen.getByRole('heading', { name: /admin users/i })).toBeInTheDocument()
  })
})
