/**
 * @file Block Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for block-related MCP tools
 * 
 * IMPORTANT:
 * - Tests block retrieval through MCP protocol
 * - Validates block data structures
 * 
 * Functionality:
 * - Tests getBlockNumber
 * - Tests getBlockDetails
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of block-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getBlockTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get current block number',
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
        
        // Extract the block number for use in other tests (but don't return it)
        const match = blockNumberText.match(/\d+/);
        if (match) {
          // Store in a variable but don't return it
          const blockNumber = parseInt(match[0], 10);
          logger.debug('Extracted block number', { blockNumber });
        }
      }
    },
    
    {
      name: 'Get latest block details',
      test: async () => {
        const result = await client.callTool('getBlockDetails', {
          blockTag: 'latest'
        });
        assertToolSuccess(result, 'Failed to get latest block details');
        
        // Find the text content in the response
        const blockDetailsText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(blockDetailsText, 'Block details response has no text content');
        
        // Verify that the response contains essential block information
        const requiredBlockInfo = ['number', 'hash', 'timestamp'];
        
        for (const info of requiredBlockInfo) {
          assert(
            blockDetailsText.toLowerCase().includes(info),
            `Block details response missing required field: ${info}`
          );
        }
        
        logger.debug('Latest block details response', { blockDetailsText });
      }
    },
    
    {
      name: 'Get specific block by number',
      test: async () => {
        // First get the current block number
        const blockNumResult = await client.callTool('getBlockNumber', {});
        const blockNumberText = blockNumResult.content.find((item: any) => item.type === 'text')?.text;
        const match = blockNumberText.match(/\d+/);
        
        // If we can't extract a block number, use a lower one that should exist
        const blockNumber = match ? Math.max(1, parseInt(match[0], 10) - 5) : 1;
        
        // Now request details for that specific block
        const result = await client.callTool('getBlockDetails', {
          blockTag: blockNumber
        });
        assertToolSuccess(result, `Failed to get details for block ${blockNumber}`);
        
        // Find the text content in the response
        const blockDetailsText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(blockDetailsText, 'Block details response has no text content');
        
        // Verify the response mentions the block number we requested
        assert(
          blockDetailsText.includes(blockNumber.toString()),
          `Block details response does not reference the requested block number ${blockNumber}`
        );
        
        logger.debug(`Block ${blockNumber} details response`, { blockDetailsText });
      }
    },
    
    {
      name: 'Get block with transactions',
      test: async () => {
        // This test may be more complex depending on the MCP implementation
        // First get the latest block number to have better chances of finding transactions
        const blockNumResult = await client.callTool('getBlockNumber', {});
        const blockNumberText = blockNumResult.content.find((item: any) => item.type === 'text')?.text;
        const match = blockNumberText.match(/\d+/);
        
        // Use a recent block that likely has transactions
        const blockNumber = match ? Math.max(1, parseInt(match[0], 10) - 1) : 1;
        
        // Request the block with transactions
        const result = await client.callTool('getBlockDetails', {
          blockTag: blockNumber
        });
        assertToolSuccess(result, `Failed to get block ${blockNumber} with transactions`);
        
        const blockDetailsText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(blockDetailsText, 'Block details response has no text content');
        
        // Verify the response contains transaction information
        // Note: The block might not have transactions, so we're checking if the response
        // at least acknowledges the concept of transactions
        assert(
          blockDetailsText.includes('transaction') || 
          blockDetailsText.includes('tx'),
          `Block details response does not include transaction information`
        );
        
        logger.debug(`Block ${blockNumber} with transactions response`, { blockDetailsText });
      }
    }
  ];
} 