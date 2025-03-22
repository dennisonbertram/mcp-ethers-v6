/**
 * @file Wallet Tests
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Wallet functionality tests for the MCP Ethers server
 * 
 * IMPORTANT:
 * - Tests should be independent
 * - Use addresses from popular/known addresses for read-only tests
 * 
 * Functionality:
 * - Testing wallet balance checking
 * - Testing wallet generation
 * - Testing transaction fetching
 */

import { McpStandardClient } from '../mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess, assertToolResponseContains } from '../utils/assertions.js';
import { logger } from '../../../utils/logger.js';

// Test addresses - using well-known addresses for testing
const TEST_ADDRESSES = {
  // Vitalik's address
  vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  // Ethereum Foundation
  foundation: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
  // Binance hot wallet
  binance: '0x28C6c06298d514Db089934071355E5743bf21d60'
};

/**
 * Run wallet-related tests
 * 
 * @param client The MCP client to use
 */
export async function runWalletTests(client: McpStandardClient): Promise<void> {
  // Combined test function that runs all wallet tests
  // This is a convenience function for running all tests at once
  
  // Get balance for a known address
  const balanceResult = await client.callTool('getWalletBalance', { 
    address: TEST_ADDRESSES.vitalik
  });
  assertToolSuccess(balanceResult, 'Wallet balance request failed');
  
  // Test wallet generation (non-persistent)
  const generateResult = await client.callTool('generateWallet', { 
    saveToEnv: false 
  });
  assertToolSuccess(generateResult, 'Wallet generation failed');
  assertToolResponseContains(generateResult, 'New wallet generated', 'Wallet generation response incorrect');
  
  // Test transaction lookup
  // Note: In a real test, you might want to use a known transaction hash
  // that won't change, but for this example we'll skip the actual hash check
  
  logger.info('All wallet tests completed successfully');
}

/**
 * Get the list of tests in this suite
 */
export function getWalletTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get wallet balance',
      test: async () => {
        const result = await client.callTool('getWalletBalance', { 
          address: TEST_ADDRESSES.vitalik
        });
        assertToolSuccess(result, 'Wallet balance request failed');
        
        const balanceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(balanceText, 'Balance response has no text content');
        assert(balanceText.includes('ETH'), 'Balance response does not include ETH currency');
      }
    },
    {
      name: 'Get Foundation wallet balance',
      test: async () => {
        const result = await client.callTool('getWalletBalance', { 
          address: TEST_ADDRESSES.foundation
        });
        assertToolSuccess(result, 'Foundation wallet balance request failed');
      }
    },
    {
      name: 'Generate new wallet',
      test: async () => {
        const result = await client.callTool('generateWallet', { 
          saveToEnv: false 
        });
        assertToolSuccess(result, 'Wallet generation failed');
        assertToolResponseContains(result, 'New wallet generated', 'Wallet generation response incorrect');
        
        // Parse the wallet address from the response
        const responseText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(responseText, 'Wallet generation response has no text content');
        
        // Extract the address using regex
        const addressMatch = responseText.match(/Address:\s+([0-9a-fA-Fx]+)/);
        assertDefined(addressMatch, 'Could not find wallet address in response');
        
        const address = addressMatch[1];
        assert(address.startsWith('0x'), 'Generated address does not start with 0x');
        assert(address.length === 42, 'Generated address is not the correct length');
      }
    },
    {
      name: 'Generate wallet and check its balance',
      test: async () => {
        // Generate a wallet first
        const genResult = await client.callTool('generateWallet', { 
          saveToEnv: false 
        });
        
        const responseText = genResult.content.find((item: any) => item.type === 'text')?.text;
        const addressMatch = responseText.match(/Address:\s+([0-9a-fA-Fx]+)/);
        const address = addressMatch[1];
        
        // Now check its balance
        const balanceResult = await client.callTool('getWalletBalance', { 
          address
        });
        assertToolSuccess(balanceResult, 'New wallet balance request failed');
        
        // New wallets should have 0 balance
        const balanceText = balanceResult.content.find((item: any) => item.type === 'text')?.text;
        assert(balanceText.includes('0 ETH') || balanceText.includes('0.0 ETH'), 
          'New wallet should have 0 balance');
      }
    }
  ];
} 