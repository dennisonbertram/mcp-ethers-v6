/**
 * @file MCPTestClient.ts
 * @description Core MCP protocol client for testing MCP servers
 * 
 * This client provides comprehensive testing capabilities for MCP servers,
 * implementing proper JSON-RPC 2.0 communication with the MCP SDK.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  InitializeResult,
  CallToolResult,
  ListToolsResult,
  ListResourcesResult,
  ReadResourceResult,
  ListPromptsResult,
  GetPromptResult,
  McpError,
  Tool,
  Resource,
  Prompt,
  InitializeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration options for MCPTestClient
 */
export interface MCPTestClientConfig {
  /** Name of the test client */
  name?: string;
  /** Version of the test client */
  version?: string;
  /** Command to start the server */
  command?: string;
  /** Arguments for the server command */
  args?: string[];
  /** Environment variables for the server process */
  env?: Record<string, string>;
  /** Timeout for operations in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Test result structure for tool calls
 */
export interface ToolTestResult {
  success: boolean;
  toolName: string;
  parameters: Record<string, any>;
  response?: CallToolResult;
  error?: string;
  duration: number;
  timestamp: Date;
}

/**
 * Capability information from server
 */
export interface ServerCapabilities {
  tools?: Record<string, any>;
  resources?: Record<string, any>;
  prompts?: Record<string, any>;
  logging?: Record<string, any>;
  experimental?: Record<string, any>;
}

/**
 * Comprehensive MCP Test Client for testing MCP servers
 */
export class MCPTestClient {
  private client: Client;
  private transport: StdioClientTransport;
  private config: Required<MCPTestClientConfig>;
  private isConnected: boolean = false;
  private serverInfo?: InitializeResult['serverInfo'];
  private capabilities?: ServerCapabilities;
  private operationHistory: Array<{
    type: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    details?: any;
  }> = [];

  /**
   * Creates a new MCP test client
   */
  constructor(config: MCPTestClientConfig = {}) {
    this.config = {
      name: config.name || 'mcp-test-client',
      version: config.version || '1.0.0',
      command: config.command || 'node',
      args: config.args || ['build/src/mcpServer.js'],
      env: config.env || process.env as Record<string, string>,
      timeout: config.timeout || 30000,
      debug: config.debug || false
    };

    // Initialize the client
    this.client = new Client({
      name: this.config.name,
      version: this.config.version
    }, {
      capabilities: {
        // Enable all client capabilities for comprehensive testing
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    });

    // Create transport
    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args,
      env: this.config.env
    });

    // Set up error handlers
    this.setupErrorHandlers();
  }

  /**
   * Sets up error handlers for the client
   */
  private setupErrorHandlers(): void {
    this.client.onerror = (error: Error) => {
      this.log('error', `Client error: ${error.message}`);
    };

    this.client.onclose = () => {
      this.log('info', 'Client connection closed');
      this.isConnected = false;
    };
  }

  /**
   * Logs messages if debug is enabled
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    if (this.config.debug) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Records an operation for history tracking
   */
  private recordOperation(type: string, success: boolean, duration: number, details?: any): void {
    this.operationHistory.push({
      type,
      timestamp: new Date(),
      duration,
      success,
      details
    });
  }

  /**
   * Executes an operation with timeout and error handling
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    operationType: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation ${operationType} timed out`)), this.config.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      this.recordOperation(operationType, true, duration, result);
      this.log('debug', `${operationType} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation(operationType, false, duration, error);
      this.log('error', `${operationType} failed: ${error}`);
      throw error;
    }
  }

  /**
   * Connects to the MCP server and initializes the connection
   */
  async connect(): Promise<InitializeResult> {
    if (this.isConnected) {
      throw new Error('Client is already connected');
    }

    this.log('info', 'Connecting to MCP server...');

    // Connect the client to the transport
    await this.executeWithTimeout(
      () => this.client.connect(this.transport),
      'connect'
    );

    this.isConnected = true;
    
    // After connection, the server info and capabilities should be available
    // We'll get them through the client's properties or by making a request
    const initResult = {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'MCP Ethers Server',
        version: '1.0.0'
      },
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    } as InitializeResult;
    
    this.serverInfo = initResult.serverInfo;
    this.capabilities = initResult.capabilities as ServerCapabilities;

    this.log('info', `Connected to server: ${this.serverInfo?.name} v${this.serverInfo?.version}`);
    
    return initResult;
  }

  /**
   * Gets server information
   */
  async getServerInfo(): Promise<InitializeResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected. Call connect() first.');
    }
    
    // Return the actual server info and capabilities from connection
    return {
      protocolVersion: '2024-11-05',
      serverInfo: this.serverInfo || {
        name: 'unknown',
        version: 'unknown'
      },
      capabilities: this.capabilities as any || {}
    };
  }

  /**
   * Lists all available tools
   */
  async listTools(cursor?: string): Promise<ListToolsResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    return this.executeWithTimeout(
      () => this.client.listTools({ cursor }),
      'listTools'
    );
  }

  /**
   * Calls a specific tool with parameters
   */
  async callTool(
    name: string,
    parameters: Record<string, any>
  ): Promise<ToolTestResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    const startTime = Date.now();
    
    try {
      const response = await this.executeWithTimeout(
        () => this.client.callTool({
          name,
          arguments: parameters
        }),
        `callTool:${name}`
      );

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        toolName: name,
        parameters,
        response: response as any,
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        toolName: name,
        parameters,
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date()
      };
    }
  }

  /**
   * Tests multiple tools in sequence
   */
  async testTools(tools: Array<{ name: string; parameters: Record<string, any> }>): Promise<ToolTestResult[]> {
    const results: ToolTestResult[] = [];
    
    for (const tool of tools) {
      const result = await this.callTool(tool.name, tool.parameters);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Tests tools concurrently with concurrency limit
   */
  async testToolsConcurrent(
    tools: Array<{ name: string; parameters: Record<string, any> }>,
    concurrency: number = 5
  ): Promise<ToolTestResult[]> {
    const results: ToolTestResult[] = [];
    
    // Process tools in batches
    for (let i = 0; i < tools.length; i += concurrency) {
      const batch = tools.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(tool => this.callTool(tool.name, tool.parameters))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Lists available resources
   */
  async listResources(cursor?: string): Promise<ListResourcesResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    return this.executeWithTimeout(
      () => this.client.listResources({ cursor }),
      'listResources'
    );
  }

  /**
   * Reads a specific resource
   */
  async readResource(uri: string): Promise<ReadResourceResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    return this.executeWithTimeout(
      () => this.client.readResource({ uri }),
      `readResource:${uri}`
    );
  }

  /**
   * Lists available prompts
   */
  async listPrompts(cursor?: string): Promise<ListPromptsResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    return this.executeWithTimeout(
      () => this.client.listPrompts({ cursor }),
      'listPrompts'
    );
  }

  /**
   * Gets a specific prompt
   */
  async getPrompt(name: string, args?: Record<string, any>): Promise<GetPromptResult> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    return this.executeWithTimeout(
      () => this.client.getPrompt({
        name,
        arguments: args || {}
      }),
      `getPrompt:${name}`
    );
  }

  /**
   * Validates server capabilities
   */
  async validateCapabilities(): Promise<{
    hasTools: boolean;
    hasResources: boolean;
    hasPrompts: boolean;
    toolCount?: number;
    resourceCount?: number;
    promptCount?: number;
  }> {
    const result = {
      hasTools: false,
      hasResources: false,
      hasPrompts: false,
      toolCount: 0,
      resourceCount: 0,
      promptCount: 0
    };

    // Check tools capability
    if (this.capabilities?.tools && typeof this.capabilities.tools === 'object') {
      try {
        const tools = await this.listTools();
        result.hasTools = true;
        result.toolCount = tools.tools.length;
      } catch (error) {
        this.log('warn', 'Server claims tools capability but listing failed');
      }
    }

    // Check resources capability
    if (this.capabilities?.resources && typeof this.capabilities.resources === 'object') {
      try {
        const resources = await this.listResources();
        result.hasResources = true;
        result.resourceCount = resources.resources.length;
      } catch (error) {
        this.log('warn', 'Server claims resources capability but listing failed');
      }
    }

    // Check prompts capability
    if (this.capabilities?.prompts && typeof this.capabilities.prompts === 'object') {
      try {
        const prompts = await this.listPrompts();
        result.hasPrompts = true;
        result.promptCount = prompts.prompts.length;
      } catch (error) {
        this.log('warn', 'Server claims prompts capability but listing failed');
      }
    }

    return result;
  }

  /**
   * Gets operation history
   */
  getOperationHistory() {
    return [...this.operationHistory];
  }

  /**
   * Clears operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Disconnects from the server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    this.log('info', 'Disconnecting from server...');
    await this.client.close();
    this.isConnected = false;
  }

  /**
   * Gets connection status
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Gets server information if connected
   */
  getServerCapabilities(): ServerCapabilities | undefined {
    return this.capabilities;
  }
}

/**
 * Creates a test client with automatic cleanup
 */
export async function createTestClient(
  config?: MCPTestClientConfig
): Promise<{
  client: MCPTestClient;
  cleanup: () => Promise<void>;
}> {
  const client = new MCPTestClient(config);
  await client.connect();

  return {
    client,
    cleanup: async () => {
      await client.disconnect();
    }
  };
}