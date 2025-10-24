// vitest setup file
import '@testing-library/jest-dom';
import { ethers } from 'ethers';
import { vi } from 'vitest';

// Provide a minimal ethereum mock when needed in tests (opt-in per test)
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Reduce console noise from ENS lookups in tests by stubbing provider methods that
// would attempt ENS resolution on anvil/unknown networks.
try {
  vi.spyOn(ethers.JsonRpcProvider.prototype as any, 'resolveName').mockResolvedValue(null);
} catch {}

try {
  // Some versions may call getResolver internally; ensure it doesn't throw
  vi.spyOn(ethers.JsonRpcProvider.prototype as any, 'getResolver').mockResolvedValue(null);
} catch {}
