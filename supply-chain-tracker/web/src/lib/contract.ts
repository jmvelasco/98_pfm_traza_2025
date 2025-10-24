// Contract helpers for Home page registration logic
// These helpers centralize all contract interactions to avoid magic strings
// and ensure type safety across the application.
// The frontend should never use strings directly or interact with TypeChain.

import { ethers } from 'ethers';
import { CONTRACT_CONFIG, NETWORK_CONFIG } from '../config/contracts';
import { SupplyChain__factory } from '../types/factories/SupplyChain__factory';
import {
  UserStatus as StatusEnum,
  UserRole as UserRoleEnum,
  type UserRole,
  type UserStatus,
} from './enums';

// UserInfo can contain any role string from the contract, including 'Admin'
export type UserInfo = { role: UserRole | null; status: UserStatus | null };

// Row used by Admin users listing
export type Users = {
  address: string;
  role: UserRole | null;
  status: UserStatus | null;
};

// --- Provider helpers: ensure correct network and provide fallbacks ---
async function ensureWalletOnCorrectNetwork(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) return;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    const desired = BigInt(NETWORK_CONFIG.chainId);
    if (net.chainId !== desired) {
      // Try to switch; if not added, try to add it
      const hexChainId = '0x' + NETWORK_CONFIG.chainId.toString(16);
      try {
        await window.ethereum.request?.({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
      } catch (err: any) {
        // 4902: Unrecognized chain; try to add
        if (err?.code === 4902) {
          await window.ethereum.request?.({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: NETWORK_CONFIG.name,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
        } else {
          throw err;
        }
      }
    }
  } catch {
    // Silent: we'll fallback to RPC provider for reads
  }
}

async function getReadProvider(): Promise<ethers.JsonRpcProvider> {
  // Always use direct JSON-RPC for READS to avoid wallet cached blockTag issues
  // (e.g., BlockOutOfRangeError when Anvil restarts and wallet still references old height)
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
}

async function getSignerOnCorrectNetwork(): Promise<ethers.Signer> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }
  await ensureWalletOnCorrectNetwork();
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

/**
 * Get user information from the contract
 * @param address - Ethereum address of the user
 * @returns User information including role and status
 */
export async function getUserInfo(address: string): Promise<UserInfo> {
  try {
    // Get provider from window.ethereum
    const provider = await getReadProvider();
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

    const rolesMap: Record<string, UserRole> = {
      Producer: UserRoleEnum.Producer,
      Factory: UserRoleEnum.Factory,
      Retailer: UserRoleEnum.Retailer,
      Consumer: UserRoleEnum.Consumer,
      Admin: UserRoleEnum.Admin,
    };

    return {
      role: rolesMap[user.role] || null,
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
    // address is intentionally unused because the contract uses msg.sender
    // Keep it in the signature to match existing call sites
    void address;
    const signer = await getSignerOnCorrectNetwork();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);

    // Call requestUserRole from contract
    const tx = await contract.requestUserRole(role);
    await tx.wait();
  } catch (error) {
    console.error('Error requesting role:', error);
    throw error;
  }
}

/**
 * Request a token transfer to another address (initiates a pending transfer)
 * @param tokenId - ID of the token to transfer
 * @param to - Recipient address
 * @param amount - Amount to transfer
 */
export async function requestTransfer(tokenId: number, to: string, amount: number): Promise<void> {
  try {
    const signer = await getSignerOnCorrectNetwork();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);

    const tx = await (contract as any).requestTransfer(tokenId, to, amount);
    await tx.wait();
  } catch (e) {
    console.error('Error requesting transfer:', e);
    throw e;
  }
}

/**
 * Admin: change status of a user
 * @param userAddress - target user address
 * @param newStatus - new status to set (Approved/Rejected/Pending)
 */
export async function changeStatusUser(userAddress: string, newStatus: UserStatus): Promise<void> {
  try {
    const signer = await getSignerOnCorrectNetwork();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);

    const tx = await contract.changeStatusUser(userAddress, toContractStatus(newStatus));
    await tx.wait();
  } catch (error) {
    console.error('Error changing user status:', error);
    throw error;
  }
}

// Map frontend status string to contract enum value
function toContractStatus(status: UserStatus): number {
  switch (status) {
    case StatusEnum.Pending:
      return 0;
    case StatusEnum.Approved:
      return 1;
    case StatusEnum.Rejected:
      return 2;
    default:
      return 0;
  }
}

export async function getUsers(): Promise<Users[]> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) return [];
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Use signer so msg.sender is the connected account (must be admin)
    const signer = await provider.getSigner();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);

    // Use getAllUsers from the contract and return ALL users with their current status/role
    const all: any[] = await (contract as any).getAllUsers();
    if (!all || !Array.isArray(all)) return [];

    const statusMap: Record<number, UserStatus> = {
      0: StatusEnum.Pending,
      1: StatusEnum.Approved,
      2: StatusEnum.Rejected,
      // 3: Canceled (not represented in frontend enum)
    };

    const mapped: Users[] = all.map((u: any) => ({
      address: String(u.userAddress ?? u[1] ?? ''),
      role: (u.role ?? u[2] ?? null) || null,
      status: statusMap[Number(u.status ?? u[3] ?? 0)] || null,
    }));

    return mapped; // no filtering: show all users so approved ones remain visible
  } catch (e) {
    console.error('Error getting users list:', e);
    return [];
  }
}

/**
 * Create a new token (mint raw material for Producer)
 * @param params - Token creation parameters
 * @returns Promise that resolves when token is created
 */
export async function createToken(params: {
  name: string;
  totalSupply: number;
  features: string;
  parentId: number;
}): Promise<void> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No ethereum provider found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, signer);

    // Call createToken on the contract
    const tx = await contract.createToken(
      params.name,
      params.totalSupply,
      params.features,
      params.parentId
    );

    // Wait for transaction to be mined
    await tx.wait();
  } catch (e) {
    console.error('Error creating token:', e);
    throw e;
  }
}

/**
 * Token details from contract
 */
export type TokenDetails = {
  id: number;
  creator: string;
  name: string;
  totalSupply: number;
  features: string;
  parentId: number;
  dateCreated: number;
  balance: number;
};

/**
 * Get all token IDs owned by a user
 * @param userAddress - Address of the user
 * @returns Array of token IDs
 */
export async function getUserTokens(userAddress: string): Promise<number[]> {
  try {
    const provider = await getReadProvider();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

    // Call getUserTokens from contract
    const tokenIds = await contract.getUserTokens(userAddress);

    // Convert BigInt to number
    return tokenIds.map((id: any) => Number(id));
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
}

/**
 * Get token details by ID
 * @param tokenId - Token ID
 * @param userAddress - Address to check balance for
 * @returns Token details including balance for the user
 */
export async function getTokenDetails(
  tokenId: number,
  userAddress: string
): Promise<TokenDetails | null> {
  try {
    const provider = await getReadProvider();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

    // Get token info
    const token = await contract.getToken(tokenId);

    // Get balance for the user
    const balance = await contract.getTokenBalance(tokenId, userAddress);

    return {
      id: Number(token.id),
      creator: token.creator,
      name: token.name,
      totalSupply: Number(token.totalSupply),
      features: token.features,
      parentId: Number(token.parentId),
      dateCreated: Number(token.dateCreated),
      balance: Number(balance),
    };
  } catch (error) {
    console.error('Error getting token details:', error);
    return null;
  }
}

/**
 * Pending transfer data structure
 */
export type PendingTransfer = {
  id: string | number;
  tokenId: number;
  tokenName: string | null;
  amount: number;
  to: string;
  status: string;
  createdAt?: number;
};

/**
 * New paginated API: list pending transfers sent by an address
 * Returns items and total so the caller can paginate.
 */
export async function getPendingBySender(
  senderAddress: string,
  offset = 0,
  limit = 10
): Promise<{ items: PendingTransfer[]; total: number }> {
  try {
    const provider = await getReadProvider();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

    // Call contract method to get paginated pending transfers
    const result: any = await (contract as any).getPendingBySender(
      senderAddress,
      BigInt(offset),
      BigInt(limit)
    );

    // Ethers v6 can return either tuple [items, total] or object with named props
    const items = (result?.[0] ?? result?.items ?? []) as any[];
    const totalRaw = result?.[1] ?? result?.total ?? 0n;
    const total = Number(totalRaw);

    const mapped: PendingTransfer[] = await Promise.all(
      items.map(async (t: any) => {
        const tokenId = Number(t.tokenId ?? t[3] ?? 0);
        let tokenName: string | null = null;
        try {
          const token = await contract.getToken(tokenId);
          tokenName = token.name || null;
        } catch {
          // ignore
        }
        return {
          id: Number(t.id ?? t[0] ?? 0),
          tokenId,
          tokenName,
          amount: Number(t.amount ?? t[5] ?? 0),
          to: String(t.to ?? t[2] ?? ''),
          status: mapTransferStatus(Number(t.status ?? t[6] ?? 0)),
          createdAt: Number(t.dateCreated ?? t[4] ?? 0),
        };
      })
    );

    return { items: mapped, total };
  } catch (error) {
    console.error('Error getting paginated pending transfers (sender):', error);
    return { items: [], total: 0 };
  }
}

/**
 * New paginated API: list pending transfers to be received by an address
 */
export async function getPendingByRecipient(
  recipientAddress: string,
  offset = 0,
  limit = 10
): Promise<{ items: PendingTransfer[]; total: number }> {
  try {
    const provider = await getReadProvider();
    const contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

    const result: any = await (contract as any).getPendingByRecipient(
      recipientAddress,
      BigInt(offset),
      BigInt(limit)
    );

    const items = (result?.[0] ?? result?.items ?? []) as any[];
    const totalRaw = result?.[1] ?? result?.total ?? 0n;
    const total = Number(totalRaw);

    const mapped: PendingTransfer[] = await Promise.all(
      items.map(async (t: any) => {
        const tokenId = Number(t.tokenId ?? t[3] ?? 0);
        let tokenName: string | null = null;
        try {
          const token = await contract.getToken(tokenId);
          tokenName = token.name || null;
        } catch {
          // ignore
        }
        return {
          id: Number(t.id ?? t[0] ?? 0),
          tokenId,
          tokenName,
          amount: Number(t.amount ?? t[5] ?? 0),
          to: String(t.to ?? t[2] ?? ''),
          status: mapTransferStatus(Number(t.status ?? t[6] ?? 0)),
          createdAt: Number(t.dateCreated ?? t[4] ?? 0),
        };
      })
    );

    return { items: mapped, total };
  } catch (error) {
    console.error('Error getting paginated pending transfers (recipient):', error);
    return { items: [], total: 0 };
  }
}

/**
 * Get pending transfers sent by a specific address
 * @param senderAddress - Address of the sender
 * @returns Array of pending transfers
 */
export async function getPendingTransfersBySender(
  senderAddress: string
): Promise<PendingTransfer[]> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return [];
    }

    // Backward-compatible wrapper: fetch first page with a generous limit
    const { items } = await getPendingBySender(senderAddress, 0, 50);
    return items;
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return [];
  }
}

/**
 * Map contract transfer status enum to string
 */
function mapTransferStatus(status: number): string {
  switch (status) {
    case 0:
      return 'Pending';
    case 1:
      return 'Accepted';
    case 2:
      return 'Rejected';
    default:
      return 'Unknown';
  }
}
