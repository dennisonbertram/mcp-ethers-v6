/**
 * @file Prompts Index
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * 
 * Central export point for all prompt registrations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEnsPrompts } from "./ensPrompts.js";

/**
 * Registers all prompts with the MCP server
 */
export function registerAllPrompts(server: McpServer) {
  // Register prompt categories
  registerEnsPrompts(server);
} 