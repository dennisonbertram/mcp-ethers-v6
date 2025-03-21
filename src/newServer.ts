/**
 * @file New Server Entry Point
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Entry point for the refactored MCP server
 */

import { initializeMcpServer } from "./mcpServer.js";

// Initialize the MCP server
initializeMcpServer().catch(error => {
  // Exit with error code in case of failure
  process.exit(1);
}); 