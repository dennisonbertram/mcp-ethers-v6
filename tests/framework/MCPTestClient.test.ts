/**
 * @file MCPTestClient.test.ts
 * @description Tests for the MCPTestClient implementation
 */

import { MCPTestClient, createTestClient } from './MCPTestClient.js';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('MCPTestClient', () => {
  let client: MCPTestClient;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    // Create test client with debug enabled for testing
    const result = await createTestClient({
      debug: true,
      timeout: 10000
    });
    client = result.client;
    cleanup = result.cleanup;
  }, 30000);

  afterAll(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Connection Management', () => {
    test('should connect to server successfully', () => {
      expect(client.isClientConnected()).toBe(true);
    });

    test('should retrieve server capabilities', () => {
      const capabilities = client.getServerCapabilities();
      expect(capabilities).toBeDefined();
    });

    test('should validate server capabilities', async () => {
      const validation = await client.validateCapabilities();
      expect(validation).toHaveProperty('hasTools');
      expect(validation).toHaveProperty('hasResources');
      expect(validation).toHaveProperty('hasPrompts');
      
      if (validation.hasTools) {
        expect(validation.toolCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Tool Operations', () => {
    test('should list available tools', async () => {
      const result = await client.listTools();
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      
      // The server should have at least one tool
      expect(result.tools.length).toBeGreaterThan(0);
      
      // Each tool should have required properties
      if (result.tools.length > 0) {
        const tool = result.tools[0];
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
      }
    });

    test('should call a tool successfully', async () => {
      // First, get the list of tools
      const tools = await client.listTools();
      
      // If there's a simple tool like getBlockNumber, test it
      const blockNumberTool = tools.tools.find((t: any) => t.name === 'getBlockNumber');
      if (blockNumberTool) {
        const result = await client.callTool('getBlockNumber', {
          provider: 'ethereum'
        });
        
        expect(result.success).toBe(true);
        expect(result.toolName).toBe('getBlockNumber');
        expect(result.response).toBeDefined();
        expect(result.duration).toBeGreaterThan(0);
      }
    });

    test('should handle tool errors gracefully', async () => {
      const result = await client.callTool('nonexistentTool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.toolName).toBe('nonexistentTool');
    });

    test('should test multiple tools sequentially', async () => {
      const toolTests = [
        { name: 'getBlockNumber', parameters: { provider: 'ethereum' } },
        { name: 'getBalance', parameters: { 
          address: '0x0000000000000000000000000000000000000000',
          provider: 'ethereum'
        }}
      ];
      
      const results = await client.testTools(toolTests);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(toolTests.length);
      results.forEach((result: any) => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('toolName');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('timestamp');
      });
    });

    test('should test tools concurrently', async () => {
      const toolTests = [
        { name: 'getBlockNumber', parameters: { provider: 'ethereum' } },
        { name: 'getBlockNumber', parameters: { provider: 'polygon' } },
        { name: 'getBlockNumber', parameters: { provider: 'arbitrum' } }
      ];
      
      const results = await client.testToolsConcurrent(toolTests, 2);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(toolTests.length);
    });
  });

  describe('Resource Operations', () => {
    test('should list available resources', async () => {
      const capabilities = client.getServerCapabilities();
      
      // Only test if server supports resources
      if (capabilities?.resources) {
        const result = await client.listResources();
        expect(result).toHaveProperty('resources');
        expect(Array.isArray(result.resources)).toBe(true);
      }
    });

    test('should read a resource', async () => {
      const capabilities = client.getServerCapabilities();
      
      // Only test if server supports resources
      if (capabilities?.resources) {
        const resources = await client.listResources();
        
        if (resources.resources.length > 0) {
          const firstResource = resources.resources[0];
          const result = await client.readResource(firstResource.uri);
          
          expect(result).toHaveProperty('contents');
          expect(Array.isArray(result.contents)).toBe(true);
        }
      }
    });
  });

  describe('Prompt Operations', () => {
    test('should list available prompts', async () => {
      const capabilities = client.getServerCapabilities();
      
      // Only test if server supports prompts
      if (capabilities?.prompts) {
        const result = await client.listPrompts();
        expect(result).toHaveProperty('prompts');
        expect(Array.isArray(result.prompts)).toBe(true);
      }
    });

    test('should get a specific prompt', async () => {
      const capabilities = client.getServerCapabilities();
      
      // Only test if server supports prompts
      if (capabilities?.prompts) {
        const prompts = await client.listPrompts();
        
        if (prompts.prompts.length > 0) {
          const firstPrompt = prompts.prompts[0];
          const result = await client.getPrompt(firstPrompt.name);
          
          expect(result).toHaveProperty('messages');
          expect(Array.isArray(result.messages)).toBe(true);
        }
      }
    });
  });

  describe('Operation History', () => {
    test('should track operation history', () => {
      const history = client.getOperationHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      // Each history entry should have required properties
      if (history.length > 0) {
        const entry = history[0];
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('duration');
        expect(entry).toHaveProperty('success');
      }
    });

    test('should clear operation history', () => {
      client.clearHistory();
      const history = client.getOperationHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when calling methods before connection', async () => {
      const disconnectedClient = new MCPTestClient();
      
      await expect(disconnectedClient.listTools()).rejects.toThrow('Client is not connected');
      await expect(disconnectedClient.callTool('test', {})).rejects.toThrow('Client is not connected');
      await expect(disconnectedClient.listResources()).rejects.toThrow('Client is not connected');
      await expect(disconnectedClient.listPrompts()).rejects.toThrow('Client is not connected');
    });

    test('should handle timeout properly', async () => {
      const timeoutClient = new MCPTestClient({
        timeout: 1 // Very short timeout
      });
      
      // This should timeout
      await expect(timeoutClient.connect()).rejects.toThrow('timed out');
    });
  });
});

describe('MCPTestClient Integration', () => {
  test('should complete full test workflow', async () => {
    const { client, cleanup } = await createTestClient({
      debug: false,
      timeout: 15000
    });
    
    try {
      // Validate connection
      expect(client.isClientConnected()).toBe(true);
      
      // Validate capabilities
      const validation = await client.validateCapabilities();
      expect(validation).toBeDefined();
      
      // List and test tools if available
      if (validation.hasTools) {
        const tools = await client.listTools();
        expect(tools.tools.length).toBeGreaterThan(0);
        
        // Test at least one tool
        if (tools.tools.length > 0) {
          const firstTool = tools.tools[0];
          const testResult = await client.callTool(firstTool.name, {});
          expect(testResult).toHaveProperty('success');
        }
      }
      
      // Check history
      const history = client.getOperationHistory();
      expect(history.length).toBeGreaterThan(0);
      
    } finally {
      await cleanup();
    }
  }, 30000);
});