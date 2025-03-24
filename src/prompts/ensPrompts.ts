/**
 * @file ENS Prompts
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2025-03-23
 * 
 * Prompt definitions for ENS-related operations
 * 
 * IMPORTANT:
 * - Provides guidance for LLMs handling ENS operations
 * - Establishes patterns for cross-network operations
 * 
 * Functionality:
 * - Cross-network ENS resolution prompt
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register ENS-related prompts with the MCP server
 */
export function registerEnsPrompts(server: McpServer) {
  // ENS Cross-Network Resolution Prompt
  server.prompt(
    "resolveEnsAcrossNetworks",
    "A prompt that guides resolving ENS names on Ethereum mainnet and performing operations with the resolved address on other networks.",
    {
      ensName: z.string().describe("The ENS name to resolve (e.g., 'vitalik.eth')"),
      targetNetwork: z.string().describe("The target network to perform operations on (e.g., 'MEGA Testnet', 'Optimism')"),
      operation: z.enum(["balance", "txCount", "code"]).describe("The operation to perform: 'balance' for ETH balance, 'txCount' for transaction count, 'code' for contract code")
    },
    ({ ensName, targetNetwork, operation }) => {
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
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I need to resolve the ENS name '${ensName}' and ${operationGuidance}. Please follow these steps:

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
          }
        }]
      };
    }
  );
} 