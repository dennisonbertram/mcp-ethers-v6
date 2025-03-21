/**
 * @file Tools Index
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Central export point for all tool registrations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCoreTools } from "./core.js";
import { registerERC20Tools } from "./erc20.js";
import { silentLogger } from "../utils/silentLogger.js";

/**
 * Registers all tools with the MCP server
 */
export function registerAllTools(server: McpServer, ethersService: any) {
  // Register tool categories
  registerCoreTools(server, ethersService);
  registerERC20Tools(server, ethersService);
  
  // TODO: Add other tool categories as they are refactored
  // registerERC721Tools(server, ethersService);
  // registerERC1155Tools(server, ethersService);
  
  silentLogger.info("All tools registered successfully");
} 