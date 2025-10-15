// Contract helpers for Home page registration logic
// These helpers centralize all contract interactions to avoid magic strings
// and ensure type safety across the application.
// The frontend should never use strings directly or interact with TypeChain.

import type { UserRole, UserStatus } from './enums';

export type UserInfo = { role: UserRole | null, status: UserStatus | null };

/**
 * Get user information from the contract
 * @param address - Ethereum address of the user
 * @returns User information including role and status
 */
export async function getUserInfo(address: string): Promise<UserInfo> {
  // TODO: Call contract.getUserInfo(address) when contract integration is ready
  // Placeholder: should call contract to get user info
  return { role: null, status: null };
}

/**
 * Request a role for the current user
 * @param address - Ethereum address of the user
 * @param role - Role to request (must be a valid UserRole)
 * @returns Promise that resolves when the transaction is confirmed
 */
export async function requestUserRole(address: string, role: UserRole): Promise<void> {
  // TODO: Call contract.requestUserRole(role) when contract integration is ready
  // Placeholder: should call contract to request role
  console.log(`Requesting role ${role} for address ${address}`);
}
