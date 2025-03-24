/**
 * @file Prompt Tools
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2025-03-24
 * 
 * Tools that provide access to MCP prompts through the tool interface
 * 
 * IMPORTANT:
 * - Bridges the gap between tools and prompts
 * - Allows accessing prompt content through tool calls
 * 
 * Functionality:
 * - Lists available prompts
 * - Retrieves ENS cross-network resolution guidance
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register prompt-related tools with the MCP server
 */
export function registerPromptTools(server: McpServer) {
  // Tool to list available prompts
  server.tool(
    "listPrompts",
    "List all available prompts in the system",
    {},
    async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            prompts: [
              {
                name: "resolveEnsAcrossNetworks",
                description: "A prompt that guides resolving ENS names on Ethereum mainnet and performing operations with the resolved address on other networks.",
                arguments: [
                  {
                    name: "ensName",
                    description: "The ENS name to resolve (e.g., 'vitalik.eth')",
                    required: true
                  },
                  {
                    name: "targetNetwork",
                    description: "The target network to perform operations on (e.g., 'MEGA Testnet', 'Optimism')",
                    required: true
                  },
                  {
                    name: "operation",
                    description: "The operation to perform: 'balance' for ETH balance, 'txCount' for transaction count, 'code' for contract code",
                    required: true
                  }
                ]
              }
            ]
          }, null, 2)
        }]
      };
    }
  );

  // Tool to get the ENS cross-network resolution guidance
  server.tool(
    "getEnsResolutionGuidance",
    "Get guidance for resolving ENS names across networks and performing operations",
    {
      ensName: z.string().describe("The ENS name to resolve (e.g., 'vitalik.eth')"),
      targetNetwork: z.string().describe("The target network to perform operations on (e.g., 'MEGA Testnet', 'Optimism')"),
      operation: z.enum(["balance", "txCount", "code"]).describe("The operation to perform: 'balance' for ETH balance, 'txCount' for transaction count, 'code' for contract code")
    },
    async (params) => {
      const { ensName, targetNetwork, operation } = params;
      
      // Define guidance for each type of operation
      let operationGuidance = "";
      switch (operation) {
        case "balance":
          operationGuidance = `check the ETH balance of the resolved address on the ${targetNetwork} network`;
          break;
        case "txCount":
          operationGuidance = `check the transaction count of the resolved address on the ${targetNetwork} network`;
          break;
        case "code":
          operationGuidance = `check if the resolved address contains contract code on the ${targetNetwork} network`;
          break;
      }

      return {
        content: [{
          type: "text",
          text: `Guidance for resolving ENS name '${ensName}' and ${operationGuidance}:

1. First, use the 'resolveName' tool with the provider set to 'Ethereum' to resolve the ENS name on Ethereum mainnet, as ENS domains are primarily registered there.

2. Before proceeding with the target network:
   - Use the 'getAllNetworks' tool to verify the exact name of the '${targetNetwork}' network
   - If the provided name doesn't match exactly, identify the correct network name from the results

3. After resolving the ENS name on Ethereum mainnet:
   - Use the resolved Ethereum address to perform the requested ${operation} operation on the target network
   - Use the appropriate tool ('getWalletBalance', 'getWalletTransactionCount', or 'getContractCode') with the provider parameter set to the verified target network name

4. Present the results clearly, specifying both:
   - The original ENS name and its resolved address
   - The network on which the operation was performed
   - The complete results of the operation

This approach ensures reliable ENS resolution while allowing operations across any supported blockchain network.`
        }]
      };
    }
  );
} 