/**
 * @file Network Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for network-related MCP tools
 * 
 * IMPORTANT:
 * - Tests network tools through MCP protocol
 * - Validates network data structures
 * 
 * Functionality:
 * - Tests getSupportedNetworks
 * - Tests getBlockNumber
 * - Tests getGasPrice
 * - Tests getFeeData
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of network-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getNetworkTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get supported networks',
      test: async () => {
        const result = await client.callTool('getSupportedNetworks', {});
        assertToolSuccess(result, 'Failed to get supported networks');
        
        // Find the text content in the response
        const networkText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(networkText, 'Network response has no text content');
        
        // Verify that the result contains at least one network
        assert(
          networkText.includes('Ethereum') || 
          networkText.includes('mainnet') || 
          networkText.includes('network'),
          'Network response does not contain expected network information'
        );
        
        // Log the networks for debugging
        logger.debug('Network response content', { networkText });
      }
    },
    
    {
      name: 'Get block number',
      test: async () => {
        const result = await client.callTool('getBlockNumber', {});
        assertToolSuccess(result, 'Failed to get block number');
        
        // Find the text content in the response
        const blockNumberText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(blockNumberText, 'Block number response has no text content');
        
        // Verify that the result contains a number
        const numberPattern = /\d+/;
        assert(
          numberPattern.test(blockNumberText),
          `Block number response "${blockNumberText}" does not contain a number`
        );
        
        logger.debug('Block number response', { blockNumberText });
      }
    },
    
    {
      name: 'Get gas price',
      test: async () => {
        const result = await client.callTool('getGasPrice', {});
        assertToolSuccess(result, 'Failed to get gas price');
        
        // Find the text content in the response
        const gasPriceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(gasPriceText, 'Gas price response has no text content');
        
        // Verify the gas price contains a number and a unit
        assert(
          /\d+/.test(gasPriceText) && 
          (gasPriceText.toLowerCase().includes('gwei') || gasPriceText.toLowerCase().includes('wei')),
          `Gas price response "${gasPriceText}" does not contain a valid gas price`
        );
        
        logger.debug('Gas price response', { gasPriceText });
      }
    },
    
    {
      name: 'Get fee data',
      test: async () => {
        const result = await client.callTool('getFeeData', {});
        assertToolSuccess(result, 'Failed to get fee data');
        
        // Find the text content in the response
        const feeDataText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(feeDataText, 'Fee data response has no text content');
        
        // Verify that the fee data contains expected fields
        const expectedTerms = ['gas', 'fee', 'price', 'base', 'priority'];
        const hasExpectedTerms = expectedTerms.some(term => 
          feeDataText.toLowerCase().includes(term)
        );
        
        assert(
          hasExpectedTerms,
          `Fee data response "${feeDataText}" does not contain expected fee information`
        );
        
        logger.debug('Fee data response', { feeDataText });
      }
    }
  ];
} 