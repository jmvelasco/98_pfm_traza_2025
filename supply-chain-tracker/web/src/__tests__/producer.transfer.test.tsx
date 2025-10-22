import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TransferForm from '../components/TransferForm'
import * as contract from '../lib/contract'

// Mocks
vi.mock('../lib/contract', () => ({
  getUserInfo: vi.fn(),
  requestTransfer: vi.fn(),
}))
vi.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: '0xproducer' }),
}))

describe('TransferForm', () => {
  it('renders form and validates basic fields', () => {
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request transfer/i })).toBeDisabled()
  })

  it('blocks transfer of derived tokens (parentId > 0)', () => {
    render(<TransferForm tokenId={2} parentId={2} balance={100} />)
    expect(
      screen.getByText(/derived tokens cannot be transferred by producer/i)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /request transfer/i })).not.toBeInTheDocument()
  })

  it('shows error if destination address is invalid', async () => {
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: 'invalid' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/invalid address/i)).toBeInTheDocument()
  })

  it('requires Factory approved recipient', async () => {
    ;(contract as any).getUserInfo.mockResolvedValue({ role: 'Retailer', status: 'Approved' })
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: '0xfactory' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/recipient must be an approved factory/i)).toBeInTheDocument()
  })

  it('requires amount > 0 and <= balance', async () => {
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: '0xfactory' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '101' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/insufficient balance/i)).toBeInTheDocument()
  })

  it('calls requestTransfer on valid input and shows success', async () => {
    ;(contract as any).getUserInfo.mockResolvedValue({ role: 'Factory', status: 'Approved' })
    ;(contract as any).requestTransfer.mockResolvedValue()
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: '0xfactory' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/requesting transfer/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/transfer requested/i)).toBeInTheDocument())
  })

  it('surfaces contract errors', async () => {
    ;(contract as any).getUserInfo.mockResolvedValue({ role: 'Factory', status: 'Approved' })
    ;(contract as any).requestTransfer.mockRejectedValue(new Error('Insufficient balance'))
    render(<TransferForm tokenId={1} parentId={0} balance={100} />)
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: '0xfactory' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /request transfer/i }))
    expect(await screen.findByText(/insufficient balance/i)).toBeInTheDocument()
  })
})
