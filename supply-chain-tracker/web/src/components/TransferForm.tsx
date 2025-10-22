import React, { useState } from 'react'

export type TransferFormProps = {
  tokenId: number
  parentId: number
  balance: number
}


export default function TransferForm({ tokenId, parentId, balance }: TransferFormProps) {
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')

  function isValidAddress(addr: string) {
    // Accepts 0x-prefixed, 40 hex chars (simple check)
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  if (parentId > 0) {
    return (
      <div data-testid="transfer-form">
        <p>Derived tokens cannot be transferred by producer</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidAddress(destination)) {
      return
    }
  }

  return (
    <form data-testid="transfer-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          name="destination"
          value={destination}
          onChange={e => setDestination(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          name="amount"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={
          !destination || !amount || !isValidAddress(destination)
        }
      >
        Request Transfer
      </button>
    </form>
  )
}
