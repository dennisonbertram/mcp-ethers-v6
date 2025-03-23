/**
 * @file Network Resource
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2025-03-23
 * 
 * Network resource for MCP
 * 
 * IMPORTANT:
 * - Provides network information via MCP resource
 * 
 * Functionality:
 * - Lists all networks and their details
 * - Provides RPC, chain ID, and native token info
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { networkList, NetworkName } from "../config/networkList.js";
import { DEFAULT_PROVIDERS } from "../config/networks.js";

/**
 * Register network resource with the MCP server
 */
export function registerNetworkResource(server: McpServer) {
  // Register a resource for listing all networks
  server.resource(
    "networks",
    "networks://all",
    async (uri) => {
      // Format network data into a user-friendly format
      const networkData = DEFAULT_PROVIDERS.map(networkName => {
        // Type guard to ensure networkName is a valid key for networkList
        if (!(networkName in networkList)) return null;
        
        const networkInfo = networkList[networkName as NetworkName];
        return {
          name: networkName,
          chainId: networkInfo.chainId,
          nativeToken: networkInfo.currency,
          rpcUrl: networkInfo.RPC,
          explorer: networkInfo.explorer || ''
        };
      }).filter(Boolean); // Remove null entries
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(networkData, null, 2)
        }]
      };
    }
  );
  
  // Create a resource template for network details
  const networkTemplate = new ResourceTemplate("networks://{name}", { list: undefined });
  
  // Register a resource for a specific network
  server.resource(
    "network-details",
    networkTemplate,
    async (uri, variables) => {
      const name = variables.name as string;
      
      // Find network by name (case insensitive)
      const networkName = DEFAULT_PROVIDERS.find(
        provider => provider.toLowerCase() === name.toLowerCase()
      );
      
      if (!networkName || !(networkName in networkList)) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: `Network '${name}' not found` }, null, 2)
          }]
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
        contents: [{
          uri: uri.href,
          text: JSON.stringify(data, null, 2)
        }]
      };
    }
  );
} 