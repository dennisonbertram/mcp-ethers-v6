/**
 * @file McpServer Implementation
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * This file implements the MCP server using the higher-level McpServer class
 * as per the latest MCP TypeScript specification.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EthersService } from "./services/ethersService.js";
import { config } from "dotenv";
import { ethers } from "ethers";
import { DefaultProvider } from "./config/networks.js";
import { registerAllTools } from "./tools/index.js";
import { fileURLToPath } from 'url';

// Load environment variables
config();

/**
 * Creates and initializes the MCP server for Ethers v6
 */
export async function initializeMcpServer() {
  // Initialize the server with metadata
  const server = new McpServer({
    name: "ethers-wallet-server",
    version: "1.0.0"
  });

  // Initialize the ethers service with configurable default network
  const defaultNetworkInput = process.env.DEFAULT_NETWORK || "mainnet";
  
  // Convert common network names to the official names used in DefaultProvider
  const networkAliasMap: Record<string, DefaultProvider> = {
    mainnet: "Ethereum",
    ethereum: "Ethereum",
    polygon: "Polygon PoS",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    avalanche: "Avalanche C-Chain",
    base: "Base",
  };
  
  const defaultNetwork =
    networkAliasMap[defaultNetworkInput.toLowerCase()] ||
    (defaultNetworkInput as DefaultProvider);

  // Create provider with the correct network name
  const provider = new ethers.AlchemyProvider(
    defaultNetwork === "Ethereum"
      ? "mainnet"
      : defaultNetwork.toLowerCase().replace(" ", "-"),
    process.env.ALCHEMY_API_KEY
  );
  
  const ethersService = new EthersService(provider);

  // Register all tools
  registerAllTools(server, ethersService);
  
  console.log(`Initializing Ethers v6 MCP Server with network: ${defaultNetwork}`);
  
  // Setup the transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  return { server, ethersService };
}

// Check if this file is being run directly, in an ES module compatible way
const isMainModule = async () => {
  try {
    const modulePath = fileURLToPath(import.meta.url);
    return process.argv[1] === modulePath;
  } catch (e) {
    return false;
  }
};

// If this file is run directly, initialize the server
isMainModule().then(isMain => {
  if (isMain) {
    initializeMcpServer().catch(error => {
      console.error("Failed to initialize MCP server:", error);
      process.exit(1);
    });
  }
}); 