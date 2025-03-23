/**
 * @file Network Tools
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2025-03-23
 * 
 * Network tools for MCP server
 * 
 * IMPORTANT:
 * - Provides network information via MCP tools
 * 
 * Functionality:
 * - Lists all networks and their details
 * - Provides access to specific network information
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { networkList, NetworkName } from "../config/networkList.js";
import { DEFAULT_PROVIDERS } from "../config/networks.js";
import { z } from "zod";

/**
 * Register network tools with the MCP server
 */
export function registerNetworkTools(server: McpServer) {
  // Get all networks tool
  server.tool(
    "getAllNetworks",
    {},
    async () => {
      // Format network data into a user-friendly format
      const networks = DEFAULT_PROVIDERS
        .filter(networkName => networkName in networkList)
        .map(networkName => {
          const networkInfo = networkList[networkName as NetworkName];
          return {
            name: networkName,
            chainId: networkInfo.chainId,
            nativeToken: networkInfo.currency,
            rpcUrl: networkInfo.RPC,
            explorer: networkInfo.explorer || ''
          };
        });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(networks, null, 2)
        }]
      };
    }
  );
  
  // Get specific network tool
  server.tool(
    "getNetwork",
    {
      name: z.string().describe("The name of the network to get details for")
    },
    async ({ name }) => {
      // Find network by name (case insensitive)
      const networkName = DEFAULT_PROVIDERS.find(
        provider => provider.toLowerCase() === name.toLowerCase()
      );
      
      if (!networkName || !(networkName in networkList)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Network '${name}' not found` }, null, 2)
          }],
          isError: true
        };
      }
      
      const networkInfo = networkList[networkName as NetworkName];
      const data = {
        name: networkName,
        chainId: networkInfo.chainId,
        nativeToken: networkInfo.currency,
        rpcUrl: networkInfo.RPC,
        explorer: networkInfo.explorer || ''
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }]
      };
    }
  );
} 