import { ethers } from 'ethers';

// Network mapping
const NETWORK_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  31337: 'Localhost',
};

// Types
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
}

// Web3 Service Class
class Web3Service {
  /**
   * Check if MetaMask is available
   */
  isMetaMaskAvailable(): boolean {
    return !!(window as any).ethereum?.isMetaMask;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed');
    }

    const ethereum = (window as any).ethereum;

    try {
      // Request accounts
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get chain ID
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    const ethereum = (window as any).ethereum;

    try {
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get balance');
    }
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    const ethereum = (window as any).ethereum;
    const hexChainId = `0x${chainId.toString(16)}`;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to switch network');
    }
  }

  /**
   * Get current network information
   */
  async getCurrentNetwork(): Promise<NetworkInfo> {
    const ethereum = (window as any).ethereum;

    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });

      const numericChainId = parseInt(chainId, 16);
      const name = NETWORK_NAMES[numericChainId] || 'Unknown Network';

      return {
        chainId: numericChainId,
        name,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get network info');
    }
  }
}

// Export singleton instance
export const web3Service = new Web3Service();