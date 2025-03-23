/**
 * @file Transaction Send Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for transaction sending MCP tools
 * 
 * IMPORTANT:
 * - Tests transaction sending in mock mode
 * - Does not actually broadcast transactions
 * 
 * Functionality:
 * - Tests sendTransaction (mock mode)
 * - Tests sendTransactionWithOptions (mock mode)
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of transaction send tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getTransactionSendTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Send transaction in mock mode',
      test: async () => {
        // First need to ensure there's a wallet loaded
        await client.callTool('generateWallet', { saveToEnv: true });
        
        // Create a simple transfer transaction in mock mode
        const result = await client.callTool('sendTransaction', {
          to: '0x1234567890123456789012345678901234567890',
          value: '0.01',
          mockMode: true // Important: Use mock mode to avoid actual broadcasts
        });
        assertToolSuccess(result, 'Failed to send mock transaction');
        
        // Find the text content in the response
        const txText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(txText, 'Transaction send response has no text content');
        
        // Verify the response mentions this is a mock transaction
        assert(
          txText.toLowerCase().includes('mock') || txText.toLowerCase().includes('simulation'),
          `Transaction send response does not indicate this is a mock transaction: ${txText}`
        );
        
        // The response should contain transaction details
        const txDetails = ['to', 'value', 'hash'];
        for (const detail of txDetails) {
          assert(
            txText.toLowerCase().includes(detail),
            `Transaction send response missing expected detail: ${detail}`
          );
        }
        
        logger.debug('Mock transaction send response', { txText });
      }
    },
    
    {
      name: 'Send transaction with options in mock mode',
      test: async () => {
        // First need to ensure there's a wallet loaded
        await client.callTool('checkWalletExists', {});
        
        // Create a transaction with specific gas options in mock mode
        const result = await client.callTool('sendTransactionWithOptions', {
          to: '0x1234567890123456789012345678901234567890',
          value: '0.01',
          gasLimit: '21000',
          maxFeePerGas: '50',
          maxPriorityFeePerGas: '2',
          mockMode: true // Important: Use mock mode to avoid actual broadcasts
        });
        assertToolSuccess(result, 'Failed to send mock transaction with options');
        
        // Find the text content in the response
        const txText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(txText, 'Transaction send with options response has no text content');
        
        // Verify the response mentions this is a mock transaction
        assert(
          txText.toLowerCase().includes('mock') || txText.toLowerCase().includes('simulation'),
          `Transaction send with options response does not indicate this is a mock transaction: ${txText}`
        );
        
        // The response should contain transaction details including gas options
        const txDetails = ['to', 'value', 'gas', 'fee'];
        for (const detail of txDetails) {
          assert(
            txText.toLowerCase().includes(detail),
            `Transaction send with options response missing expected detail: ${detail}`
          );
        }
        
        logger.debug('Mock transaction send with options response', { txText });
      }
    }
  ];
} 