/**
 * @file Standard MCP Client
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * A standardized MCP client implementation using the official SDK
 * 
 * IMPORTANT:
 * - Use for testing the Ethers MCP server
 * - Handles connection lifecycle
 * 
 * Functionality:
 * - Connect to MCP server
 * - List available tools
 * - Call tools
 * - Disconnect cleanly
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../../utils/logger.js";

/**
 * A standardized MCP client using the official SDK
 */
export class McpStandardClient {
  private client: Client;
  private transport: StdioClientTransport;
  private connected: boolean = false;

  /**
   * Creates a new MCP standard client
   * @param options Configuration options
   */
  constructor(options: {
    serverCommand?: string;
    serverArgs?: string[];
    clientName?: string;
    clientVersion?: string;
  } = {}) {
    const {
      serverCommand = "node",
      serverArgs = ["build/src/index.js"],
      clientName = "mcp-ethers-test-client",
      clientVersion = "1.0.0"
    } = options;

    // Create the transport
    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
      env: process.env as Record<string, string>,
    });
    
    logger.info(`Using stdio transport with command: ${serverCommand} ${serverArgs.join(' ')}`);

    // Create the client
    this.client = new Client(
      {
        name: clientName,
        version: clientVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    logger.info("MCP Standard Client initialized", { clientName, clientVersion });
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      logger.warn("Client already connected, ignoring connect request");
      return;
    }

    try {
      logger.info("Connecting to MCP server...");
      await this.client.connect(this.transport);
      this.connected = true;
      logger.info("Connected to MCP server successfully");
    } catch (error) {
      logger.error("Failed to connect to MCP server", { error });
      throw error;
    }
  }

  /**
   * List all available tools from the server
   */
  async listTools(): Promise<any> {
    this.ensureConnected();
    
    try {
      logger.debug("Listing available tools");
      return await this.client.listTools();
    } catch (error) {
      logger.error("Failed to list tools", { error });
      throw error;
    }
  }

  /**
   * Call a tool on the MCP server
   * 
   * @param name The name of the tool to call
   * @param args The arguments to pass to the tool
   * @returns The tool result
   */
  async callTool(name: string, args: Record<string, any> = {}): Promise<any> {
    this.ensureConnected();
    
    try {
      logger.debug("Calling tool", { name, args });
      return await this.client.callTool({
        name,
        arguments: args,
      });
    } catch (error) {
      logger.error("Failed to call tool", { name, args, error });
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      logger.warn("Client not connected, ignoring disconnect request");
      return;
    }

    try {
      logger.info("Disconnecting from MCP server...");
      // Client doesn't have a disconnect method, so we'll just mark as disconnected
      this.connected = false;
      
      // Close the transport if it has a close method
      if (typeof this.transport.close === 'function') {
        await this.transport.close();
      }
      
      logger.info("Disconnected from MCP server successfully");
    } catch (error) {
      logger.error("Failed to disconnect from MCP server", { error });
      throw error;
    }
  }

  /**
   * Ensure the client is connected before performing operations
   * @private
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error("Client not connected. Call connect() first");
    }
  }
} 