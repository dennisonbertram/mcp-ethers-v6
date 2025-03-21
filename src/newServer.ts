/**
 * @file New Server Entry Point
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Entry point for the refactored MCP server
 */

import { initializeMcpServer } from "./mcpServer.js";

console.log("Starting refactored Ethers v6 MCP Server...");

initializeMcpServer().catch(error => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
}); 