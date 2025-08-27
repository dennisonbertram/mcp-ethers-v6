/**
 * @file ERC20 Tool Handlers
 * @version 1.0.0
 * 
 * Tool handlers for ERC20 token standard operations
 */

import { z } from 'zod';
import { TokenOperationOptions } from '../../services/erc/types.js';
import { validateWithFriendlyErrors, createErrorResponse, CommonSchemas } from '../../utils/validation.js';

// This will be injected during initialization
let ethersService: any;

export function initializeErc20Handlers(service: any) {
  ethersService = service;
}

// Common schemas with user-friendly messages
const tokenAddressSchema = CommonSchemas.ethereumAddress.describe('ERC20 token contract address');
const providerSchema = CommonSchemas.provider;
const chainIdSchema = CommonSchemas.chainId;
const amountSchema = CommonSchemas.amountString.describe('Token amount in smallest unit (e.g., "1000000000000000000" for 1 token with 18 decimals)');

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
      const { tokenAddress, provider, chainId } = validateWithFriendlyErrors(
        schema, 
        args, 
        'Get ERC20 Token Information'
      );
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
      return createErrorResponse(error, 'getting token information');
    }
  },
  
  getERC20Balance: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      ownerAddress: CommonSchemas.ethereumAddress.describe('Address to check balance for'),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { tokenAddress, ownerAddress, provider, chainId } = validateWithFriendlyErrors(
        schema,
        args,
        'Get ERC20 Balance'
      );
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
      return createErrorResponse(error, 'getting token balance');
    }
  },
  
  getERC20Allowance: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      ownerAddress: CommonSchemas.ethereumAddress.describe('Token owner address'),
      spenderAddress: CommonSchemas.ethereumAddress.describe('Address authorized to spend tokens'),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { tokenAddress, ownerAddress, spenderAddress, provider, chainId } = validateWithFriendlyErrors(
        schema,
        args,
        'Get ERC20 Allowance'
      );
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
      return createErrorResponse(error, 'getting token allowance');
    }
  },
  
  transferERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      recipientAddress: CommonSchemas.ethereumAddress.describe('Recipient address for the tokens'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      const { tokenAddress, recipientAddress, amount, provider, chainId, gasLimit, gasPrice } = validateWithFriendlyErrors(
        schema,
        args,
        'Transfer ERC20 Tokens'
      );
      
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
      return createErrorResponse(error, 'transferring tokens');
    }
  },
  
  approveERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      spenderAddress: CommonSchemas.ethereumAddress.describe('Address to approve for spending tokens'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      const { tokenAddress, spenderAddress, amount, provider, chainId, gasLimit, gasPrice } = validateWithFriendlyErrors(
        schema,
        args,
        'Approve ERC20 Spending'
      );
      
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
      return createErrorResponse(error, 'approving token spending');
    }
  },
  
  transferFromERC20: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: tokenAddressSchema,
      senderAddress: CommonSchemas.ethereumAddress.describe('Address to transfer tokens from (requires prior approval)'),
      recipientAddress: CommonSchemas.ethereumAddress.describe('Address to transfer tokens to'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      const { tokenAddress, senderAddress, recipientAddress, amount, provider, chainId, gasLimit, gasPrice } = validateWithFriendlyErrors(
        schema,
        args,
        'Transfer ERC20 Tokens From Another Address'
      );
      
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
      return createErrorResponse(error, 'transferring tokens from another account');
    }
  }
}; 