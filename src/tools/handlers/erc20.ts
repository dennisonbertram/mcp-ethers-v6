/**
 * @file ERC20 Tool Handlers
 * @version 1.0.0
 * 
 * Tool handlers for ERC20 token standard operations
 */

import { z } from 'zod';
import { TokenOperationOptions } from '../../services/erc/types.js';

// This will be injected during initialization
let ethersService: any;

export function initializeErc20Handlers(service: any) {
  ethersService = service;
}

// Common schemas for repeated use
const tokenAddressSchema = z.string();
const providerSchema = z.string().optional();
const chainIdSchema = z.number().optional();
const amountSchema = z.string();

// Options schema for transaction operations
const optionsSchema = z.object({
  gasLimit: z.union([z.string(), z.number()]).optional(),
  gasPrice: z.union([z.string(), z.number()]).optional(),
  maxFeePerGas: z.union([z.string(), z.number()]).optional(),
  maxPriorityFeePerGas: z.union([z.string(), z.number()]).optional(),
  nonce: z.number().optional(),
  value: z.string().optional(),
}).optional();

export const erc20Handlers = {
  getERC20TokenInfo: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { tokenAddress, provider, chainId } = schema.parse(args);
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
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
  },
  
  getERC20Balance: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      ownerAddress: z.string(),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { tokenAddress, ownerAddress, provider, chainId } = schema.parse(args);
      const balance = await ethersService.getERC20Balance(ownerAddress, tokenAddress, provider, chainId);
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `${ownerAddress} has a balance of ${balance} ${tokenInfo.symbol}`
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
  },
  
  getERC20Allowance: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      ownerAddress: z.string(),
      spenderAddress: z.string(),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { tokenAddress, ownerAddress, spenderAddress, provider, chainId } = schema.parse(args);
      const allowance = await ethersService.getERC20Allowance(
        tokenAddress, 
        ownerAddress, 
        spenderAddress, 
        provider, 
        chainId
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `${spenderAddress} is approved to spend ${allowance} ${tokenInfo.symbol} from ${ownerAddress}`
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
  },
  
  transferERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      recipientAddress: z.string(),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { tokenAddress, recipientAddress, amount, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.transferERC20(
        tokenAddress, 
        recipientAddress, 
        amount, 
        provider, 
        chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${amount} ${tokenInfo.symbol} to ${recipientAddress}.\nTransaction Hash: ${tx.hash}`
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
  },
  
  approveERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      spenderAddress: z.string(),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { tokenAddress, spenderAddress, amount, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.approveERC20(
        tokenAddress, 
        spenderAddress, 
        amount, 
        provider, 
        chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully approved ${spenderAddress} to spend ${amount} ${tokenInfo.symbol}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error approving token spending: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  transferFromERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      senderAddress: z.string(),
      recipientAddress: z.string(),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { tokenAddress, senderAddress, recipientAddress, amount, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.transferFromERC20(
        tokenAddress, 
        senderAddress, 
        recipientAddress, 
        amount, 
        provider, 
        chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${amount} ${tokenInfo.symbol} from ${senderAddress} to ${recipientAddress}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error transferring tokens on behalf of another account: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}; 