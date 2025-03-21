/**
 * @file Tools Index
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Central export point for all tool registrations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCoreTools } from "./core.js";

/**
 * Registers all tools with the MCP server
 */
export function registerAllTools(server: McpServer, ethersService: any) {
  // Register tool categories
  registerCoreTools(server, ethersService);
  
  // TODO: Add other tool categories as they are refactored
  // registerERC20Tools(server, ethersService);
  // registerERC721Tools(server, ethersService);
  // registerERC1155Tools(server, ethersService);
  
  console.log("All tools registered successfully");
} 