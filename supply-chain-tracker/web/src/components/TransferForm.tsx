import React, { useState } from 'react';

export type TransferFormProps = {
  tokenId: number;
  parentId: number;
  balance: number;
};

import * as contract from '../lib/contract';

export default function TransferForm({ tokenId, parentId, balance }: TransferFormProps) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function isValidAddress(addr: string) {
    // Accepts 0x-prefixed, 40 hex chars (simple check)
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  if (parentId > 0) {
    return (
      <div data-testid="transfer-form">
        <p>Derived tokens cannot be transferred by producer</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAddress(destination)) {
      return;
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setMessage('Amount must be greater than 0');
      return;
    }
    if (amountNum > balance) {
      setMessage('Insufficient balance');
      return;
    }
    // Business validation: recipient must be an Approved Factory
    try {
      const info = await (contract as any).getUserInfo(destination);
      const role = info?.role;
      const status = info?.status;
      if (role !== 'Factory' || status !== 'Approved') {
        setMessage('Recipient must be an approved factory');
        return;
      }
    } catch (_err) {
      // In case of API error, surface a generic validation error
      setMessage('Recipient must be an approved factory');
      return;
    }
    // Success flow
    setMessage('Requesting transfer');
    // Yield to allow the "Requesting transfer" message to render before proceeding
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      await (contract as any).requestTransfer(tokenId, destination, amountNum);
      setMessage('Transfer requested');
    } catch (err: any) {
      setMessage(err?.message || 'Transfer failed');
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
          onChange={(e) => {
            setDestination(e.target.value);
            if (message) setMessage(null);
          }}
        />
      </div>
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          name="amount"
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (message) setMessage(null);
          }}
        />
      </div>
      {message && <div>{message}</div>}
      <button type="submit" disabled={!destination || !amount || !isValidAddress(destination)}>
        Request Transfer
      </button>
    </form>
  );
}
