// Test Utilities: Builders for transfers
// These are test-only factories to reduce boilerplate in suites.

export type TransferLike = {
  id: string;
  tokenId: number;
  tokenName: string | null;
  amount: number;
  from: string;
  to: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: number;
};

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

// Base builder with sensible defaults
export function buildTransfer(overrides: Partial<TransferLike> = {}): TransferLike {
  const idx = Math.floor(Math.random() * 100000);
  const base: TransferLike = {
    id: overrides.id ?? `tx_${Date.now()}_${idx}`,
    tokenId: overrides.tokenId ?? 1,
    tokenName: overrides.tokenName ?? 'Wheat',
    amount: overrides.amount ?? 1,
    from: overrides.from ?? '0xproducer',
    to: overrides.to ?? '0xfactory',
    status: overrides.status ?? 'Pending',
    createdAt: overrides.createdAt ?? Math.floor(Date.now() / 1000),
  };
  return { ...base, ...overrides };
}

// Deterministic Pending Sent transfer for index N
export function buildPendingSent(
  index: number,
  overrides: Partial<TransferLike> = {}
): TransferLike {
  return buildTransfer({
    id: `txS_${pad(index, 3)}`,
    tokenId: index,
    tokenName: overrides.tokenName ?? (index % 2 === 0 ? null : `Item ${index}`),
    amount: overrides.amount ?? (index % 5) + 1,
    from: overrides.from ?? '0xproducer',
    to: overrides.to ?? `0xaaa${pad(index, 2)}${'a'.repeat(36)}`.slice(0, 42),
    status: 'Pending',
    createdAt: overrides.createdAt ?? 1700000000 + index * 100,
    ...overrides,
  });
}

// Deterministic Pending Received transfer for index N
export function buildPendingReceived(
  index: number,
  overrides: Partial<TransferLike> = {}
): TransferLike {
  return buildTransfer({
    id: `txR_${pad(index, 3)}`,
    tokenId: index,
    tokenName: overrides.tokenName ?? (index % 3 === 0 ? null : `Recv ${index}`),
    amount: overrides.amount ?? (index % 7) + 1,
    from: overrides.from ?? `0xprod${pad(index, 2)}${'b'.repeat(35)}`.slice(0, 42),
    to: overrides.to ?? '0xfactory',
    status: 'Pending',
    createdAt: overrides.createdAt ?? 1700000000 + index * 90,
    ...overrides,
  });
}
