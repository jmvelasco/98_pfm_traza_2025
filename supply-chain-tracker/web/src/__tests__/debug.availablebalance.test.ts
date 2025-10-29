// Debug test to investigate why frontend is not working
// This test will call the actual contract functions (not mocked) to see real behavior

import { describe, it, expect } from 'vitest';
import {
  getUserTokensWithBalance,
  getUserTokensWithAvailableBalance,
  getAvailableBalance,
  getTokenDetails,
  getPendingOutgoingTransfersByToken,
} from '../lib/contract';

describe('Debug: Available Balance Real Contract Calls', () => {
  // Test with the REAL retailer address from the token creator
  const testAddress = '0x90F79bf6EB2c4f870365E785982E1f101E93b906'; // Real retailer from contract

  it('should show what getUserTokensWithBalance returns', async () => {
    console.log('\n=== DEBUG: getUserTokensWithBalance ===');
    try {
      const tokens = await getUserTokensWithBalance(testAddress);
      console.log('Tokens with balance:', tokens);
      expect(Array.isArray(tokens)).toBe(true);
    } catch (error) {
      console.error('Error in getUserTokensWithBalance:', error);
      expect(true).toBe(true); // Don't fail test, just log
    }
  });

  it('should show what getUserTokensWithAvailableBalance returns', async () => {
    console.log('\n=== DEBUG: getUserTokensWithAvailableBalance ===');
    try {
      const tokens = await getUserTokensWithAvailableBalance(testAddress);
      console.log('Tokens with available balance:', tokens);
      expect(Array.isArray(tokens)).toBe(true);
    } catch (error) {
      console.error('Error in getUserTokensWithAvailableBalance:', error);
      expect(true).toBe(true); // Don't fail test, just log
    }
  });

  it('should show available balance calculation for token ID 3', async () => {
    console.log('\n=== DEBUG: getAvailableBalance for token 3 ===');
    try {
      const balance = await getAvailableBalance(3, testAddress);
      console.log('Available balance for token 3:', balance);

      // Also show token details
      const details = await getTokenDetails(3, testAddress);
      console.log('Token 3 details:', details);

      expect(typeof balance).toBe('number');
    } catch (error) {
      console.error('Error in getAvailableBalance:', error);
      expect(true).toBe(true); // Don't fail test, just log
    }
  });

  it('should show pending transfers for token ID 3', async () => {
    console.log('\n=== DEBUG: getPendingOutgoingTransfersByToken for token 3 ===');
    try {
      const pending = await getPendingOutgoingTransfersByToken(3, testAddress);
      console.log('Pending outgoing transfers for token 3:', pending);
      expect(Array.isArray(pending)).toBe(true);
    } catch (error) {
      console.error('Error in getPendingOutgoingTransfersByToken:', error);
      expect(true).toBe(true); // Don't fail test, just log
    }
  });
});
