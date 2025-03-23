/**
 * @file Transaction Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for transaction-related MCP tools
 * 
 * IMPORTANT:
 * - Tests transaction retrieval through MCP protocol
 * - Validates transaction data structures
 * 
 * Functionality:
 * - Tests getTransactionDetails
 * - Tests getWalletTransactionCount
 * - Tests getGasPrice (for transactions)
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

// Example test transaction hashes on Ethereum mainnet
// These are stable, well-known transactions that should always be available
const TEST_TRANSACTIONS = {
  // First ERC-721 NFT transfer (CryptoKitties)
  firstNFT: '0xf55aab5f0c8a48c6186e4db792486193d1a2eee25fc4baf507717cd87390689a',
  // Significant historical ETH transfer
  largeTransfer: '0x793ec0d279fa2cd65d833f34f88aac68d42f9951c446860e2e5d6ef823d14b54',
  // Famous "genesis" transaction - the first transaction on Ethereum mainnet
  genesis: '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060'
};

/**
 * Get the list of transaction-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getTransactionTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get transaction details',
      test: async () => {
        const result = await client.callTool('getTransactionDetails', {
          txHash: TEST_TRANSACTIONS.firstNFT
        });
        assertToolSuccess(result, 'Failed to get transaction details');
        
        // Find the text content in the response
        const txDetailsText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(txDetailsText, 'Transaction details response has no text content');
        
        // Verify that the result contains transaction information
        const requiredTxInfo = ['hash', 'from', 'to', 'value'];
        
        for (const info of requiredTxInfo) {
          assert(
            txDetailsText.toLowerCase().includes(info),
            `Transaction details response missing required field: ${info}`
          );
        }
        
        logger.debug('Transaction details response', { txDetailsText });
      }
    },
    
    {
      name: 'Get historical transaction (genesis)',
      test: async () => {
        const result = await client.callTool('getTransactionDetails', {
          txHash: TEST_TRANSACTIONS.genesis
        });
        assertToolSuccess(result, 'Failed to get genesis transaction details');
        
        // Find the text content in the response
        const txDetailsText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(txDetailsText, 'Genesis transaction details response has no text content');
        
        // Verify this is actually the genesis transaction
        assert(
          txDetailsText.includes(TEST_TRANSACTIONS.genesis),
          `Transaction details response does not match the requested genesis transaction`
        );
        
        logger.debug('Genesis transaction details response', { txDetailsText });
      }
    },
    
    {
      name: 'Get transaction count for address',
      test: async () => {
        // Use Vitalik's address as it's guaranteed to have transactions
        const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        
        const result = await client.callTool('getWalletTransactionCount', {
          address: vitalikAddress,
          // Explicitly specify mainnet to ensure consistent results
          provider: 'mainnet'
        });
        assertToolSuccess(result, 'Failed to get transaction count');
        
        // Find the text content in the response
        const txCountText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(txCountText, 'Transaction count response has no text content');
        
        // Verify that the result contains a number
        const numberPattern = /\d+/;
        assert(
          numberPattern.test(txCountText),
          `Transaction count response "${txCountText}" does not contain a number`
        );
        
        // Extract the transaction count - we only care that we received a valid number
        const match = txCountText.match(/\d+/);
        if (match) {
          const count = parseInt(match[0], 10);
          // No assertion about the count value - just log it
          logger.debug(`Transaction count for Vitalik's address: ${count}`);
        }
        
        logger.debug('Transaction count response', { txCountText });
      }
    },
    
    {
      name: 'Get gas price for transactions',
      test: async () => {
        const result = await client.callTool('getGasPrice', {});
        assertToolSuccess(result, 'Failed to get gas price');
        
        // Find the text content in the response
        const gasPriceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(gasPriceText, 'Gas price response has no text content');
        
        // Verify that the result contains a number and the word "gwei"
        assert(
          /\d+/.test(gasPriceText) && gasPriceText.includes('gwei'),
          `Gas price response "${gasPriceText}" does not contain a valid gas price in gwei`
        );
        
        logger.debug('Gas price response', { gasPriceText });
      }
    },
    
    {
      name: 'Get detailed fee data',
      test: async () => {
        const result = await client.callTool('getFeeData', {});
        assertToolSuccess(result, 'Failed to get fee data');
        
        // Find the text content in the response
        const feeDataText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(feeDataText, 'Fee data response has no text content');
        
        // For EIP-1559 networks, we should see maxFeePerGas and maxPriorityFeePerGas
        const eip1559Terms = ['max', 'priority', 'fee', 'gas'];
        const hasEIP1559Terms = eip1559Terms.every(term => 
          feeDataText.toLowerCase().includes(term)
        );
        
        // For legacy networks, we should at least see gasPrice
        const hasLegacyTerms = feeDataText.toLowerCase().includes('gasprice');
        
        assert(
          hasEIP1559Terms || hasLegacyTerms,
          `Fee data response does not contain proper fee information`
        );
        
        logger.debug('Fee data response', { feeDataText });
      }
    }
  ];
} 