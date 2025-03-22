/**
 * @file Basic Tests
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Basic connectivity and tool discovery tests for the MCP Ethers server
 * 
 * IMPORTANT:
 * - Tests should be independent
 * - Use clear assertion messages
 * 
 * Functionality:
 * - Connection tests
 * - Tool discovery tests
 */

import { McpStandardClient } from '../mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Run basic connectivity and tool listing tests
 * 
 * @param client The MCP client to use
 */
export async function runBasicTests(client: McpStandardClient): Promise<void> {
  // Test that we're using a client that's already connected
  // The main test runner should handle connection
  
  // Verify we can list tools
  const tools = await client.listTools();
  assertDefined(tools, 'Failed to list tools');
  assertDefined(tools.tools, 'Tool list response missing tools array');
  assert(Array.isArray(tools.tools), 'Tools is not an array');
  
  // Log discovered tools
  logger.info(`Discovered ${tools.tools.length} tools`);
  
  // Verify we have at least the minimum expected tools
  const coreTools = [
    'getNetworkInfo',
    'getWalletBalance',
    'getGasPrice',
    'getTransaction'
  ];
  
  const toolNames = tools.tools.map((tool: any) => tool.name);
  
  coreTools.forEach(toolName => {
    assert(
      toolNames.includes(toolName),
      `Required tool "${toolName}" not found in server tools`
    );
  });
  
  // Test network info tool functionality
  const networkInfoResult = await client.callTool('getNetworkInfo', {});
  assertToolSuccess(networkInfoResult, 'Network info request failed');
  
  // Test gas price tool
  const gasPriceResult = await client.callTool('getGasPrice', {});
  assertToolSuccess(gasPriceResult, 'Gas price request failed');
}

/**
 * Get the list of tests in this suite
 */
export function getBasicTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'List available tools',
      test: async () => {
        const tools = await client.listTools();
        assertDefined(tools, 'Failed to list tools');
        assertDefined(tools.tools, 'Tool list response missing tools array');
        assert(Array.isArray(tools.tools), 'Tools is not an array');
        assert(tools.tools.length > 0, 'No tools returned from server');
      }
    },
    {
      name: 'Verify core tools exist',
      test: async () => {
        const tools = await client.listTools();
        const toolNames = tools.tools.map((tool: any) => tool.name);
        
        const coreTools = [
          'getNetworkInfo',
          'getWalletBalance',
          'getGasPrice',
          'getTransaction'
        ];
        
        coreTools.forEach(toolName => {
          assert(
            toolNames.includes(toolName),
            `Required tool "${toolName}" not found in server tools`
          );
        });
      }
    },
    {
      name: 'Get network information',
      test: async () => {
        const result = await client.callTool('getNetworkInfo', {});
        assertToolSuccess(result, 'Network info request failed');
      }
    },
    {
      name: 'Get gas price',
      test: async () => {
        const result = await client.callTool('getGasPrice', {});
        assertToolSuccess(result, 'Gas price request failed');
        
        const gasPriceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(gasPriceText, 'Gas price response has no text content');
        
        // Check that gas price is a number followed by 'gwei'
        const gasPriceRegex = /^[\d.]+\s*gwei$/i;
        assert(
          gasPriceRegex.test(gasPriceText),
          `Gas price response "${gasPriceText}" doesn't match expected format (number followed by 'gwei')`
        );
      }
    }
  ];
} 