/**
 * @file MCP Server
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
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
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { EthersService } from "./services/ethersService.js";
import { logger } from './utils/logger.js';

/**
 * Main entry point for the MCP server
 */
async function main() {
  try {
    logger.info('Starting MCP Ethers Wallet server...');
    
    // Create the MCP server
    const server = new McpServer({
      name: "Ethers Wallet",
      version: "1.0.0"
    });
    
    // Create EthersService
    const ethersService = new EthersService();
    
    // For debugging - log server and service initialization
    // console.log('MCP Server created and EthersService initialized');
    
    // Register all Ethereum tools
    registerAllTools(server, ethersService);
    
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