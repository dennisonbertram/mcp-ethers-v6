/**
 * @file Core Ethereum Tools
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Core Ethereum tools for basic network and wallet operations
 */

import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ethers } from "ethers";

/**
 * Registers core Ethereum tools with the MCP server
 */
export function registerCoreTools(server: McpServer, ethersService: any) {
  // Get Supported Networks tool
  server.tool(
    "getSupportedNetworks",
    {},
    async () => {
      try {
        const networks = await ethersService.getSupportedNetworks();
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(networks, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting supported networks: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get Block Number tool
  server.tool(
    "getBlockNumber",
    {
      provider: z.string().optional().describe(
        "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
      ),
      chainId: z.number().optional().describe(
        "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
      )
    },
    async ({ provider, chainId }) => {
      try {
        const blockNumber = await ethersService.getBlockNumber(provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `Current block number: ${blockNumber}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting block number: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get Gas Price tool
  server.tool(
    "getGasPrice",
    {
      provider: z.string().optional().describe(
        "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
      ),
      chainId: z.number().optional().describe(
        "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
      )
    },
    async ({ provider, chainId }) => {
      try {
        const gasPriceWei = await ethersService.getGasPrice(provider, chainId);
        const gasPriceGwei = ethers.formatUnits(gasPriceWei, "gwei");
        return {
          content: [{ 
            type: "text", 
            text: `Current gas price: ${gasPriceGwei} gwei (${gasPriceWei.toString()} wei)`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting gas price: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get Fee Data tool
  server.tool(
    "getFeeData",
    {
      provider: z.string().optional().describe(
        "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
      ),
      chainId: z.number().optional().describe(
        "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
      )
    },
    async ({ provider, chainId }) => {
      try {
        const feeData = await ethersService.getFeeData(provider, chainId);
        
        // Format the fee data for human readability
        const formatted = {
          gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "Not available",
          maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "Not available",
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " gwei" : "Not available"
        };
        
        return {
          content: [{ 
            type: "text", 
            text: `Fee Data:
Gas Price: ${formatted.gasPrice}
Max Fee Per Gas: ${formatted.maxFeePerGas}
Max Priority Fee Per Gas: ${formatted.maxPriorityFeePerGas}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting fee data: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Generate Wallet tool
  server.tool(
    "generateWallet",
    {
      saveToEnv: z.boolean().optional().describe(
        "Optional. If true, the private key will be saved to the server's environment variables for future use. Default is false."
      )
    },
    async ({ saveToEnv = false }) => {
      try {
        const wallet = ethers.Wallet.createRandom();
        
        if (saveToEnv) {
          process.env.WALLET_PRIVATE_KEY = wallet.privateKey;
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `
New wallet generated:
Address: ${wallet.address}
Private Key: ${wallet.privateKey}
${saveToEnv ? "Private key has been saved to environment variables for this session." : ""}
`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error generating wallet: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Load Wallet tool
  server.tool(
    "loadWallet",
    {
      privateKey: z.string().describe(
        "The private key of the wallet to load. Should start with '0x'."
      ),
      saveToEnv: z.boolean().optional().describe(
        "Optional. If true, the private key will be saved to the server's environment variables for this session. Default is true."
      )
    },
    async ({ privateKey, saveToEnv = true }) => {
      try {
        const wallet = new ethers.Wallet(privateKey);
        
        if (saveToEnv) {
          process.env.WALLET_PRIVATE_KEY = privateKey;
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `
Wallet loaded successfully:
Address: ${wallet.address}
${saveToEnv ? "Private key has been saved to environment variables for this session." : ""}
`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error loading wallet: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Check if wallet exists
  server.tool(
    "checkWalletExists",
    {
      provider: z.string().optional().describe(
        "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
      )
    },
    async ({ provider }) => {
      try {
        const walletInfo = await ethersService.checkWalletExists(provider);
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(walletInfo, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error checking wallet: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get Wallet Balance tool
  server.tool(
    "getWalletBalance",
    {
      address: z.string().describe(
        "The Ethereum address to query"
      ),
      provider: z.string().optional().describe(
        "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
      ),
      chainId: z.number().optional().describe(
        "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
      )
    },
    async ({ address, provider, chainId }) => {
      try {
        const balance = await ethersService.getWalletBalance(address, provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `Balance of ${address}: ${balance} ETH`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting wallet balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
} 