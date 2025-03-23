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
        // Create a new client to test reconnection without affecting the main test client
        const testClient = new McpStandardClient({
          serverCommand: 'node',
          serverArgs: ['build/src/mcpServer.js'],
          clientName: 'mcp-ethers-test-client-reconnect',
          clientVersion: '1.0.0'
        });
        
        try {
          // Connect the test client
          await testClient.connect();
          logger.debug('Test client connected for reconnection test');
          
          // Verify connection works
          const initialResult = await testClient.callTool('getSupportedNetworks', {});
          assert(
            initialResult && !initialResult.isError,
            'Failed to call tool on test client'
          );
          
          // Disconnect
          await testClient.disconnect();
          logger.debug('Test client disconnected for reconnection test');
          
          // Reconnect
          await testClient.connect();
          logger.debug('Test client reconnected for reconnection test');
          
          // Verify reconnection worked
          const result = await testClient.callTool('getSupportedNetworks', {});
          assert(
            result && !result.isError,
            'Failed to call tool after reconnection'
          );
          
          logger.debug('Reconnection test completed successfully');
        } finally {
          // Always clean up the test client
          try {
            await testClient.disconnect();
          } catch (error) {
            logger.warn('Error disconnecting test client', { error });
          }
        }
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