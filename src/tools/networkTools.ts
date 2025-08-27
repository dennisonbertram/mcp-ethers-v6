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
import { validateWithFriendlyErrors, createErrorResponse } from "../utils/validation.js";

/**
 * Register network tools with the MCP server
 */
export function registerNetworkTools(server: McpServer) {
  // Get all networks tool
  server.tool(
    "getAllNetworks",
    "Get information about all available blockchain networks. Use this to identify network names, chain IDs, and RPC URLs that can be used with other Ethereum tools. When using other tools with a 'provider' parameter, you can specify any of these network names.",
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
    "Get detailed information about a specific blockchain network. This provides the network's chain ID, native token, and RPC URL that can be used with other Ethereum tools. This network name can be used as the 'provider' parameter in other tools.",
    {
      name: z.string().describe("The name of the network to get details for (case-insensitive, e.g., 'ethereum', 'polygon', 'arbitrum')")
    },
    async ({ name }) => {
      try {
        
        // Find network by name (case insensitive)
        const networkName = DEFAULT_PROVIDERS.find(
          provider => provider.toLowerCase() === name.toLowerCase()
        );
        
        if (!networkName || !(networkName in networkList)) {
          // Get list of available networks for helpful error message
          const availableNetworks = DEFAULT_PROVIDERS
            .filter(n => n in networkList)
            .join(', ');
          
          return createErrorResponse(
            new Error(`Network '${name}' not found. Available networks are: ${availableNetworks}`),
            'getting network information'
          );
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
      } catch (error) {
        return createErrorResponse(error, 'getting network information');
      }
    }
  );
} 