/**
 * @file ERC20 Tool Handlers
 * @version 1.0.0
 * 
 * Tool handlers for ERC20 token standard operations
 */

import { z } from 'zod';
import { TokenOperationOptions } from '../../services/erc/types.js';
import { validateWithFriendlyErrors, createErrorResponse, CommonSchemas } from '../../utils/validation.js';
import { mapParameters } from '../../utils/parameterMapping.js';

// This will be injected during initialization
let ethersService: any;

export function initializeErc20Handlers(service: any) {
  ethersService = service;
}

// Common schemas with user-friendly messages and standardized parameter names
const contractAddressSchema = CommonSchemas.ethereumAddress.describe('ERC20 token contract address');
const tokenAddressSchema = CommonSchemas.ethereumAddress.optional().describe('DEPRECATED: Use contractAddress instead. ERC20 token contract address');
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
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema, 
        args, 
        'Get ERC20 Token Information'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
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
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      ownerAddress: CommonSchemas.ethereumAddress.describe('Address to check balance for'),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema,
        args,
        'Get ERC20 Balance'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      const balance = await ethersService.getERC20Balance(validatedParams.ownerAddress, contractAddr, mapped.provider, mapped.chainId);
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `${validatedParams.ownerAddress} has a balance of ${balance} ${tokenInfo.symbol}`
        }]
      };
    } catch (error) {
      return createErrorResponse(error, 'getting token balance');
    }
  },
  
  getERC20Allowance: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      ownerAddress: CommonSchemas.ethereumAddress.describe('Token owner address'),
      spenderAddress: CommonSchemas.ethereumAddress.describe('Address authorized to spend tokens'),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema,
        args,
        'Get ERC20 Allowance'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      const allowance = await ethersService.getERC20Allowance(
        contractAddr, 
        validatedParams.ownerAddress, 
        validatedParams.spenderAddress, 
        mapped.provider, 
        mapped.chainId
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `${validatedParams.spenderAddress} is approved to spend ${allowance} ${tokenInfo.symbol} from ${validatedParams.ownerAddress}`
        }]
      };
    } catch (error) {
      return createErrorResponse(error, 'getting token allowance');
    }
  },
  
  transferERC20: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      recipientAddress: CommonSchemas.ethereumAddress.describe('Recipient address for the tokens'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema,
        args,
        'Transfer ERC20 Tokens'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (validatedParams.gasLimit) options.gasLimit = validatedParams.gasLimit;
      if (validatedParams.gasPrice) options.gasPrice = validatedParams.gasPrice;
      
      const tx = await ethersService.transferERC20(
        contractAddr, 
        validatedParams.recipientAddress, 
        validatedParams.amount, 
        mapped.provider, 
        mapped.chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${validatedParams.amount} ${tokenInfo.symbol} to ${validatedParams.recipientAddress}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return createErrorResponse(error, 'transferring tokens');
    }
  },
  
  approveERC20: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      spenderAddress: CommonSchemas.ethereumAddress.describe('Address to approve for spending tokens'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema,
        args,
        'Approve ERC20 Spending'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (validatedParams.gasLimit) options.gasLimit = validatedParams.gasLimit;
      if (validatedParams.gasPrice) options.gasPrice = validatedParams.gasPrice;
      
      const tx = await ethersService.approveERC20(
        contractAddr, 
        validatedParams.spenderAddress, 
        validatedParams.amount, 
        mapped.provider, 
        mapped.chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully approved ${validatedParams.spenderAddress} to spend ${validatedParams.amount} ${tokenInfo.symbol}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return createErrorResponse(error, 'approving token spending');
    }
  },
  
  transferFromERC20: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema.optional(),
      tokenAddress: tokenAddressSchema,  // Deprecated
      senderAddress: CommonSchemas.ethereumAddress.describe('Address to transfer tokens from (requires prior approval)'),
      recipientAddress: CommonSchemas.ethereumAddress.describe('Address to transfer tokens to'),
      amount: amountSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: CommonSchemas.gasLimit,
      gasPrice: CommonSchemas.gasPrice,
    });
    
    try {
      // First validate with friendly errors
      const validatedParams = validateWithFriendlyErrors(
        schema,
        args,
        'Transfer ERC20 Tokens From Another Address'
      );
      
      // Then map deprecated parameters for backward compatibility
      const mapped = mapParameters(validatedParams);
      
      // Ensure we have a contract address (from either new or old parameter name)
      const contractAddr = mapped.contractAddress || validatedParams.tokenAddress;
      if (!contractAddr) {
        throw new Error('Contract address is required. Please provide either contractAddress or tokenAddress.');
      }
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (validatedParams.gasLimit) options.gasLimit = validatedParams.gasLimit;
      if (validatedParams.gasPrice) options.gasPrice = validatedParams.gasPrice;
      
      const tx = await ethersService.transferFromERC20(
        contractAddr, 
        validatedParams.senderAddress, 
        validatedParams.recipientAddress, 
        validatedParams.amount, 
        mapped.provider, 
        mapped.chainId,
        options
      );
      
      // Get token info to format the response
      const tokenInfo = await ethersService.getERC20TokenInfo(contractAddr, mapped.provider, mapped.chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${validatedParams.amount} ${tokenInfo.symbol} from ${validatedParams.senderAddress} to ${validatedParams.recipientAddress}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return createErrorResponse(error, 'transferring tokens from another account');
    }
  }
}; 