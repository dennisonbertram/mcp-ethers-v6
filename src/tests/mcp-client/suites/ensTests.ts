/**
 * @file ENS Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for ENS-related MCP tools
 * 
 * IMPORTANT:
 * - Tests ENS name resolution through MCP protocol
 * - Validates name resolution responses
 * 
 * Functionality:
 * - Tests lookupAddress (reverse resolution)
 * - Tests resolveName (forward resolution)
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

// Well-known ENS names and addresses for testing
const TEST_ENS = {
  // Vitalik.eth
  vitalik: {
    name: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
  },
  // Ethereum Foundation
  foundation: {
    name: 'ethereum.eth',
    address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
  }
};

/**
 * Get the list of ENS-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getEnsTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Resolve ENS name to address',
      test: async () => {
        const result = await client.callTool('resolveName', {
          name: TEST_ENS.vitalik.name,
          provider: 'mainnet' // ENS only works on mainnet
        });
        assertToolSuccess(result, 'Failed to resolve ENS name');
        
        // Find the text content in the response
        const addressText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(addressText, 'ENS resolution response has no text content');
        
        // The response should contain an Ethereum address (0x + 40 hex chars)
        assert(
          addressText.includes('0x') && /0x[0-9a-fA-F]{40}/i.test(addressText),
          `ENS resolution response does not contain a valid Ethereum address: ${addressText}`
        );
        
        // The address should match the expected address (case-insensitive comparison)
        assert(
          addressText.toLowerCase().includes(TEST_ENS.vitalik.address.toLowerCase()),
          `ENS resolution returned unexpected address: ${addressText}`
        );
        
        logger.debug('ENS name resolution', { addressText });
      }
    },
    
    {
      name: 'Lookup address to ENS name',
      test: async () => {
        const result = await client.callTool('lookupAddress', {
          address: TEST_ENS.vitalik.address,
          provider: 'mainnet' // ENS only works on mainnet
        });
        assertToolSuccess(result, 'Failed to lookup address to ENS name');
        
        // Find the text content in the response
        const nameText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(nameText, 'ENS lookup response has no text content');
        
        // The response should contain the ENS name
        assert(
          nameText.toLowerCase().includes(TEST_ENS.vitalik.name.toLowerCase()),
          `ENS lookup response does not contain the expected name: ${nameText}`
        );
        
        logger.debug('ENS address lookup', { nameText });
      }
    }
  ];
} 