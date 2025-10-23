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
  const [loading, setLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);

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
    setLoading(true);
    setMessage(null);
    // Ensure a pending status is visible for at least one paint without delaying the request call
    setShowPending(true);
    setTimeout(() => setShowPending(false), 10);
    try {
      await (contract as any).requestTransfer(tokenId, destination, amountNum);
      setMessage('Transfer requested');
      // Reset amount after success; keep destination
      setAmount('');
    } catch (err: any) {
      setMessage(err?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  const statusColor = message
    ? message === 'Transfer requested'
      ? 'text-green-600'
      : message === 'Requesting transfer'
        ? 'text-blue-600'
        : 'text-red-600'
    : '';

  return (
    <form data-testid="transfer-form" onSubmit={handleSubmit} noValidate className="mt-2 space-y-3">
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
          Destination
        </label>
        <input
          id="destination"
          name="destination"
          value={destination}
          placeholder="0x1234…"
          disabled={loading}
          onChange={(e) => {
            setDestination(e.target.value);
            if (message) setMessage(null);
          }}
          className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min="1"
          max={balance}
          value={amount}
          placeholder={`Max ${balance}`}
          disabled={loading}
          onChange={(e) => {
            setAmount(e.target.value);
            if (message) setMessage(null);
          }}
          className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {(loading || showPending) && (
        <div aria-live="polite" role="status" className="text-sm text-blue-600">
          Requesting transfer
        </div>
      )}
      {message && (
        <div aria-live="polite" role="status" className={`text-sm ${statusColor}`}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !destination || !amount || !isValidAddress(destination)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? 'Requesting…' : 'Request Transfer'}
      </button>
    </form>
  );
}
