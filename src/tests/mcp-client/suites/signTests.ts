/**
 * @file Signature Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for signature-related MCP tools
 * 
 * IMPORTANT:
 * - Tests message signing through MCP protocol
 * - Validates signature formats and responses
 * 
 * Functionality:
 * - Tests signMessage
 * - Tests ethSign
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of signature-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getSignTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Sign a simple message',
      test: async () => {
        // First need to ensure there's a wallet loaded
        await client.callTool('generateWallet', { saveToEnv: true });
        
        // Sign a test message
        const testMessage = 'Hello, Ethereum!';
        const result = await client.callTool('signMessage', {
          message: testMessage
        });
        assertToolSuccess(result, 'Failed to sign message');
        
        // Find the text content in the response
        const signatureText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(signatureText, 'Signature response has no text content');
        
        // Ethereum signatures start with 0x and are 132 characters long (65 bytes in hex)
        assert(
          signatureText.includes('0x') && /0x[0-9a-fA-F]{130}/.test(signatureText),
          `Signature response does not contain a valid Ethereum signature: ${signatureText}`
        );
        
        logger.debug('Message signature', { signatureText });
      }
    },
    
    {
      name: 'Sign data with ethSign',
      test: async () => {
        // First need to ensure there's a wallet loaded
        await client.callTool('checkWalletExists', {});
        
        // Sign some test data
        const testData = '0x48656c6c6f2c20457468657265756d21'; // "Hello, Ethereum!" in hex
        const result = await client.callTool('ethSign', {
          data: testData
        });
        assertToolSuccess(result, 'Failed to sign data with ethSign');
        
        // Find the text content in the response
        const signatureText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(signatureText, 'ethSign response has no text content');
        
        // Ethereum signatures start with 0x and are 132 characters long (65 bytes in hex)
        assert(
          signatureText.includes('0x') && /0x[0-9a-fA-F]{130}/.test(signatureText),
          `ethSign response does not contain a valid Ethereum signature: ${signatureText}`
        );
        
        logger.debug('ethSign signature', { signatureText });
      }
    }
  ];
} 