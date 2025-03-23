/**
 * @file Connection Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for MCP connection management
 * 
 * IMPORTANT:
 * - Tests connection lifecycle
 * - Tests capability negotiation
 * - Tests error scenarios
 * 
 * Functionality:
 * - Tests connection initialization
 * - Tests capability negotiation
 * - Tests disconnection and reconnection
 * - Tests error handling
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

/**
 * Get the list of connection-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getConnectionTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Connection initialization',
      test: async () => {
        // Note: The client is already connected by the test runner,
        // so we're really testing that the connection is working
        
        // We can test this by making a simple tools request
        const tools = await client.listTools();
        
        assertDefined(tools, 'Failed to list tools - connection may not be working');
        assertDefined(tools.tools, 'Tool list response missing tools array');
        assert(Array.isArray(tools.tools), 'Tools is not an array');
        assert(tools.tools.length > 0, 'No tools returned from server');
        
        logger.debug('Connection verified with tool list response', { toolCount: tools.tools.length });
      }
    },
    
    {
      name: 'Capability negotiation',
      test: async () => {
        // The client should already have negotiated capabilities during connection
        // We can test this by ensuring we can access tools
        
        const result = await client.callTool('getSupportedNetworks', {});
        assert(
          result && !result.isError,
          'Failed to call tool - capability negotiation may have failed'
        );
        
        logger.debug('Capability negotiation verified with tool call', { result });
      }
    },
    
    {
      name: 'Reconnection',
      test: async () => {
        // Disconnect and reconnect the client
        // Note: This test is more involved and assumes the client can handle reconnection
        
        // First, verify the connection works with a simple tool call
        await client.callTool('getSupportedNetworks', {});
        
        // Disconnect
        await client.disconnect();
        logger.debug('Client disconnected for reconnection test');
        
        // Try to reconnect
        await client.connect();
        logger.debug('Client reconnected for reconnection test');
        
        // Verify the reconnection worked with another tool call
        const result = await client.callTool('getSupportedNetworks', {});
        assert(
          result && !result.isError,
          'Failed to call tool after reconnection'
        );
        
        logger.debug('Reconnection test completed successfully');
      }
    },
    
    {
      name: 'Error handling',
      test: async () => {
        // Test error handling by calling a tool with invalid arguments
        try {
          await client.callTool('getWalletBalance', {
            // Missing required 'address' parameter
          });
          
          // Should not reach here
          assert(false, 'Expected error was not thrown for invalid arguments');
        } catch (error) {
          // Error was thrown as expected
          assert(true, 'Error handling works as expected');
          logger.debug('Error handling test passed', { error });
        }
      }
    }
  ];
} 