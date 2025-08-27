/**
 * @file ERC20 Token Tools
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * 
 * Tools for interacting with ERC20 tokens using the new MCP pattern
 */

import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EthersService } from '../services/ethersService.js';
import { mapParameters } from '../utils/parameterMapping.js';

// Common schemas - Standardized parameter names
const contractAddressSchema = z.string().describe(
  "The address of the ERC20 token contract"
);

// Deprecated - kept for backward compatibility
const tokenAddressSchema = z.string().describe(
  "DEPRECATED: Use contractAddress instead. The address of the ERC20 token contract"
);

const providerSchema = z.string().optional().describe(
  "Optional. Either a network name or custom RPC URL. Use getAllNetworks to see available networks and their details, or getNetwork to get info about a specific network. You can use any network name returned by these tools as a provider value."
);

const chainIdSchema = z.number().optional().describe(
  "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
);

const amountSchema = z.string().describe(
  "The amount of tokens to transfer (can be decimal, e.g. '1.5')"
);

// Gas options schema
const gasOptionsSchema = z.object({
  gasLimit: z.union([z.string(), z.number()]).optional().describe(
    "Optional. The gas limit for the transaction"
  ),
  gasPrice: z.union([z.string(), z.number()]).optional().describe(
    "Optional. The gas price for the transaction in gwei"
  ),
  maxFeePerGas: z.union([z.string(), z.number()]).optional().describe(
    "Optional. The maximum fee per gas for the transaction (EIP-1559)"
  ),
  maxPriorityFeePerGas: z.union([z.string(), z.number()]).optional().describe(
    "Optional. The maximum priority fee per gas for the transaction (EIP-1559)"
  ),
  nonce: z.number().optional().describe(
    "Optional. The nonce for the transaction"
  ),
  value: z.string().optional().describe(
    "Optional. The value to send with the transaction in ether"
  )
}).optional();

/**
 * Registers ERC20 token tools with the MCP server
 */
export function registerERC20Tools(server: McpServer, ethersService: EthersService) {
  // Get ERC20 Token Info - Using standardized parameter names
  server.tool(
    "getERC20TokenInfo",
    {
      contractAddress: contractAddressSchema,
      tokenAddress: tokenAddressSchema.optional(),  // Deprecated
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async (params) => {
      // Map deprecated parameters
      const mapped = mapParameters(params);
      
      try {
        const contractAddr = mapped.contractAddress || params.tokenAddress;
        if (!contractAddr) {
          throw new Error('Either contractAddress or tokenAddress must be provided');
        }
        const tokenInfo = await ethersService.getERC20TokenInfo(
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `Token Information:
Name: ${tokenInfo.name}
Symbol: ${tokenInfo.symbol}
Decimals: ${tokenInfo.decimals}
Total Supply: ${tokenInfo.totalSupply}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token information: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // MCP client test compatible version - erc20_getTokenInfo
  server.tool(
    "erc20_getTokenInfo",
    {
      contractAddress: contractAddressSchema,
      tokenAddress: tokenAddressSchema.optional(),  // Deprecated
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async (params) => {
      // Map deprecated parameters
      const mapped = mapParameters(params);
      
      try {
        const contractAddr = mapped.contractAddress || params.tokenAddress;
        if (!contractAddr) {
          throw new Error('Either contractAddress or tokenAddress must be provided');
        }
        const tokenInfo = await ethersService.getERC20TokenInfo(
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `Token Information:
Name: ${tokenInfo.name}
Symbol: ${tokenInfo.symbol}
Decimals: ${tokenInfo.decimals}
Total Supply: ${tokenInfo.totalSupply}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token information: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Get ERC20 Balance - Using standardized parameter names
  server.tool(
    "getERC20Balance",
    {
      contractAddress: contractAddressSchema,
      tokenAddress: tokenAddressSchema.optional(),  // Deprecated
      ownerAddress: z.string().describe(
        "The Ethereum address whose balance to check"
      ),
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async (params) => {
      // Map deprecated parameters
      const mapped = mapParameters(params);
      
      try {
        const contractAddr = mapped.contractAddress || params.tokenAddress;
        if (!contractAddr) {
          throw new Error('Either contractAddress or tokenAddress must be provided');
        }
        const balance = await ethersService.getERC20Balance(
          mapped.ownerAddress,
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        // Get token info to format the response
        const tokenInfo = await ethersService.getERC20TokenInfo(
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `${mapped.ownerAddress} has a balance of ${balance} ${tokenInfo.symbol}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // MCP client test compatible version - erc20_balanceOf
  server.tool(
    "erc20_balanceOf",
    {
      contractAddress: contractAddressSchema,
      tokenAddress: tokenAddressSchema.optional(),  // Deprecated
      ownerAddress: z.string().describe(
        "The Ethereum address whose balance to check"
      ),
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async (params) => {
      // Map deprecated parameters
      const mapped = mapParameters(params);
      
      try {
        const contractAddr = mapped.contractAddress || params.tokenAddress;
        if (!contractAddr) {
          throw new Error('Either contractAddress or tokenAddress must be provided');
        }
        const balance = await ethersService.getERC20Balance(
          mapped.ownerAddress,
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        // Get token info to format the response
        const tokenInfo = await ethersService.getERC20TokenInfo(
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `${mapped.ownerAddress} has a balance of ${balance} ${tokenInfo.symbol}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token balance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Get ERC20 Allowance - Using standardized parameter names
  server.tool(
    "getERC20Allowance",
    {
      contractAddress: contractAddressSchema,
      tokenAddress: tokenAddressSchema.optional(),  // Deprecated
      ownerAddress: z.string().describe(
        "The Ethereum address that owns the tokens"
      ),
      spenderAddress: z.string().describe(
        "The Ethereum address that is approved to spend tokens"
      ),
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async (params) => {
      // Map deprecated parameters
      const mapped = mapParameters(params);
      
      try {
        const contractAddr = mapped.contractAddress || params.tokenAddress;
        if (!contractAddr) {
          throw new Error('Either contractAddress or tokenAddress must be provided');
        }
        const allowance = await ethersService.getERC20Allowance(
          contractAddr,
          mapped.ownerAddress,
          mapped.spenderAddress,
          mapped.provider,
          mapped.chainId
        );
        
        // Get token info to format the response
        const tokenInfo = await ethersService.getERC20TokenInfo(
          contractAddr,
          mapped.provider,
          mapped.chainId
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `${mapped.spenderAddress} is approved to spend ${allowance} ${tokenInfo.symbol} from ${mapped.ownerAddress}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token allowance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Transfer ERC20
  server.tool(
    "transferERC20",
    {
      tokenAddress: tokenAddressSchema,
      recipientAddress: z.string().describe(
        "The Ethereum address to receive the tokens"
      ),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional()
    },
    async (params) => {
      try {
        // Get token info to format the response
        const tokenInfo = await ethersService.getERC20TokenInfo(
          params.tokenAddress,
          params.provider,
          params.chainId
        );
        
        // Prepare gas options
        const options = {
          gasLimit: params.gasLimit,
          gasPrice: params.gasPrice
        };
        
        const txResult = await ethersService.transferERC20(
          params.tokenAddress,
          params.recipientAddress,
          params.amount,
          params.provider,
          params.chainId,
          options
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `
Successfully transferred ${params.amount} ${tokenInfo.symbol} to ${params.recipientAddress}
Transaction Hash: ${txResult.hash}
Waiting for confirmation...`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error transferring tokens: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
  
  // Approve ERC20
  server.tool(
    "approveERC20",
    {
      tokenAddress: tokenAddressSchema,
      spenderAddress: z.string().describe(
        "The Ethereum address to approve for spending tokens"
      ),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional()
    },
    async (params) => {
      try {
        // Get token info to format the response
        const tokenInfo = await ethersService.getERC20TokenInfo(
          params.tokenAddress,
          params.provider,
          params.chainId
        );
        
        // Prepare gas options
        const options = {
          gasLimit: params.gasLimit,
          gasPrice: params.gasPrice
        };
        
        const txResult = await ethersService.approveERC20(
          params.tokenAddress,
          params.spenderAddress,
          params.amount,
          params.provider,
          params.chainId,
          options
        );
        
        return {
          content: [{ 
            type: "text", 
            text: `
Successfully approved ${params.spenderAddress} to spend ${params.amount} ${tokenInfo.symbol}
Transaction Hash: ${txResult.hash}
Waiting for confirmation...`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error approving tokens: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
} 