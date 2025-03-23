/**
 * @file Utility Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for utility-related MCP tools
 * 
 * IMPORTANT:
 * - Tests conversion and formatting functions
 * - Validates utility responses
 * 
 * Functionality:
 * - Tests formatEther
 * - Tests parseEther
 * - Tests formatUnits
 * - Tests other utility functions
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess, assertToolResponseContains } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of utility-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getUtilityTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Format wei to ether',
      test: async () => {
        // Test with 1 ETH in wei
        const oneEtherInWei = '1000000000000000000';
        
        const result = await client.callTool('formatEther', {
          wei: oneEtherInWei
        });
        assertToolSuccess(result, 'Failed to format wei to ether');
        
        // Find the text content in the response
        const formattedText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(formattedText, 'Format ether response has no text content');
        
        // Verify the formatted value contains expected output
        assert(
          formattedText.includes('1.0') || formattedText.includes('1 ETH'),
          `Formatted ether response "${formattedText}" does not contain the expected value of 1 ETH`
        );
        
        logger.debug('Format ether response', { formattedText });
      }
    },
    
    {
      name: 'Parse ether to wei',
      test: async () => {
        // Test with 1 ETH
        const oneEther = '1.0';
        
        const result = await client.callTool('parseEther', {
          ether: oneEther
        });
        assertToolSuccess(result, 'Failed to parse ether to wei');
        
        // Find the text content in the response
        const parsedText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(parsedText, 'Parse ether response has no text content');
        
        // Verify the parsed value contains expected output (1 ETH = 10^18 wei)
        assert(
          parsedText.includes('1000000000000000000') || parsedText.includes('1 ETH in wei'),
          `Parsed ether response "${parsedText}" does not contain the expected value of 1 ETH in wei`
        );
        
        logger.debug('Parse ether response', { parsedText });
      }
    },
    
    {
      name: 'Format units to gwei',
      test: async () => {
        // Test with 1 gwei in wei (1 gwei = 10^9 wei)
        const oneGweiInWei = '1000000000';
        
        const result = await client.callTool('formatUnits', {
          value: oneGweiInWei,
          unit: 'gwei'
        });
        assertToolSuccess(result, 'Failed to format units to gwei');
        
        // Find the text content in the response
        const formattedText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(formattedText, 'Format units response has no text content');
        
        // Verify the formatted value contains expected output
        assert(
          formattedText.includes('1.0') || formattedText.includes('1 gwei'),
          `Formatted gwei response "${formattedText}" does not contain the expected value of 1 gwei`
        );
        
        logger.debug('Format units response', { formattedText });
      }
    },
    
    {
      name: 'Format units with decimal places',
      test: async () => {
        // Test with a value that has decimal places
        const value = '1234567890123456789';
        
        const result = await client.callTool('formatUnits', {
          value: value,
          unit: 18  // Same as ether
        });
        assertToolSuccess(result, 'Failed to format units with decimal places');
        
        // Find the text content in the response
        const formattedText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(formattedText, 'Format units response has no text content');
        
        // The expected value should be approximately 1.23456...
        assert(
          formattedText.includes('1.23') || formattedText.includes('1,23'),
          `Formatted response "${formattedText}" does not contain the expected value starting with 1.23`
        );
        
        logger.debug('Format units with decimal places response', { formattedText });
      }
    },
    
    {
      name: 'Handle large numbers',
      test: async () => {
        // Test with a very large value
        const largeValue = '123456789012345678901234567890'; // 30 digits
        
        // Try to format this as ether
        const result = await client.callTool('formatEther', {
          wei: largeValue
        });
        assertToolSuccess(result, 'Failed to format large value');
        
        // Find the text content in the response
        const formattedText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(formattedText, 'Format large value response has no text content');
        
        // Verify we got some numeric response
        assert(
          /\d+/.test(formattedText),
          `Formatted large value response "${formattedText}" does not contain any digits`
        );
        
        logger.debug('Format large value response', { formattedText });
      }
    }
  ];
} 