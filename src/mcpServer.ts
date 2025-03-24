/**
 * @file MCP Server
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2025-03-23
 * 
 * MCP Server implementation for the Ethers wallet service
 * 
 * IMPORTANT:
 * - Entry point for MCP tools
 * - Uses stdio transport
 * 
 * Functionality:
 * - Exposes Ethereum tools via MCP
 * - Handles MCP protocol messages
 * - Provides guidance prompts for common operations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import { EthersService } from "./services/ethersService.js";
import { logger } from './utils/logger.js';

/**
 * Main entry point for the MCP server
 */
async function main() {
  try {
    logger.info('Starting MCP Ethers Wallet server...');
    
    // Create the MCP server with tools and prompts capabilities
    const server = new McpServer(
      {
        name: "Ethers Wallet",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {},
          prompts: {}
        }
      }
    );
    
    // Create EthersService
    const ethersService = new EthersService();
    
    // Register all Ethereum tools
    registerAllTools(server, ethersService);
    
    // Register all prompts
    registerAllPrompts(server);
    
    logger.info('Registered tools and prompts with MCP server');
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect to the transport
    logger.info('Connecting to stdio transport...');
    await server.connect(transport);
    
    logger.info('MCP server started and ready to receive messages');
  } catch (error) {
    logger.error('Failed to start MCP server', { error });
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  logger.error('Unhandled error in main', { error });
  process.exit(1);
}); 