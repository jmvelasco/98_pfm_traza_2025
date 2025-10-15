// Contract helpers for Home page registration logic
// These helpers centralize all contract interactions to avoid magic strings
// and ensure type safety across the application.
// The frontend should never use strings directly or interact with TypeChain.

import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contracts';
import { SupplyChain__factory } from '../types/factories/SupplyChain__factory';
import type { UserRole, UserStatus } from './enums';
import { UserStatus as StatusEnum } from './enums';

// UserInfo can contain any role string from the contract, including 'Admin'
export type UserInfo = { role: string | null, status: UserStatus | null };

/**
 * Get user information from the contract
 * @param address - Ethereum address of the user
 * @returns User information including role and status
 */
export async function getUserInfo(address: string): Promise<UserInfo> {
  try {
    // Get provider from window.ethereum
    if (typeof window === 'undefined' || !window.ethereum) {
      return { role: null, status: null };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);
    
    // Call getUserInfo from contract
    const user = await contract.getUserInfo(address);
    
    // Map contract status enum (0,1,2,3) to our status strings
    const statusMap: Record<number, UserStatus> = {
      0: StatusEnum.Pending,
      1: StatusEnum.Approved,
      2: StatusEnum.Rejected,
      // 3 would be Canceled but we don't have it in our enum yet
    };

    return {
      role: user.role || null,
      status: statusMap[Number(user.status)] || null,
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return { role: null, status: null };
  }
}

/**
 * Request a role for the current user
 * @param address - Ethereum address of the user
 * @param role - Role to request (must be a valid UserRole)
 * @returns Promise that resolves when the transaction is confirmed
 */
export async function requestUserRole(address: string, role: UserRole): Promise<void> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);
    
    // Call requestUserRole from contract
    const tx = await contract.requestUserRole(role);
    await tx.wait();
    
    console.log(`Role ${role} requested successfully for ${address}`);
  } catch (error) {
    console.error('Error requesting role:', error);
    throw error;
  }
}
