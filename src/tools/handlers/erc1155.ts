/**
 * @file ERC1155 Tool Handlers
 * @version 1.0.0
 * 
 * Tool handlers for ERC1155 multi-token standard operations
 */

import { z } from 'zod';
import { TokenOperationOptions } from '../../services/erc/types.js';
import { validateWithFriendlyErrors, createErrorResponse, CommonSchemas } from '../../utils/validation.js';

// This will be injected during initialization
let ethersService: any;

export function initializeErc1155Handlers(service: any) {
  ethersService = service;
}

// Common schemas with user-friendly messages
const contractAddressSchema = CommonSchemas.ethereumAddress.describe('ERC1155 contract address');
const providerSchema = CommonSchemas.provider;
const chainIdSchema = CommonSchemas.chainId;
const tokenIdSchema = z.union([z.string(), z.number()]).describe('Token ID (numeric identifier for the specific token type)');
const amountSchema = CommonSchemas.amountString.describe('Amount of tokens in smallest unit');

// Options schema for transaction operations
const optionsSchema = z.object({
  gasLimit: z.union([z.string(), z.number()]).optional(),
  gasPrice: z.union([z.string(), z.number()]).optional(),
  maxFeePerGas: z.union([z.string(), z.number()]).optional(),
  maxPriorityFeePerGas: z.union([z.string(), z.number()]).optional(),
  nonce: z.number().optional(),
  value: z.string().optional(),
}).optional();

export const erc1155Handlers = {
  getERC1155Balance: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      ownerAddress: CommonSchemas.ethereumAddress.describe('Address to check balance for'),
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, ownerAddress, tokenId, provider, chainId } = validateWithFriendlyErrors(
        schema,
        args,
        'Get ERC1155 Balance'
      );
      const balance = await ethersService.getERC1155Balance(
        contractAddress, 
        ownerAddress, 
        tokenId, 
        provider, 
        chainId
      );
      
      return {
        content: [{ 
          type: "text", 
          text: `${ownerAddress} has a balance of ${balance} of token ID ${tokenId} in contract ${contractAddress}`
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
  
  getERC1155BatchBalances: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      ownerAddresses: z.array(z.string()),
      tokenIds: z.array(tokenIdSchema),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, ownerAddresses, tokenIds, provider, chainId } = schema.parse(args);
      
      // Validate arrays have the same length
      if (ownerAddresses.length !== tokenIds.length) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: "Error: ownerAddresses and tokenIds arrays must have the same length"
          }]
        };
      }
      
      const balances = await ethersService.getERC1155BatchBalances(
        contractAddress, 
        ownerAddresses, 
        tokenIds, 
        provider, 
        chainId
      );
      
      // Build a formatted response
      let responseText = `Batch balances for contract ${contractAddress}:`;
      
      for (let i = 0; i < ownerAddresses.length; i++) {
        responseText += `\n${ownerAddresses[i]} has ${balances[i]} of token ID ${tokenIds[i]}`;
      }
      
      return {
        content: [{ 
          type: "text", 
          text: responseText
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error getting batch balances: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  getERC1155Metadata: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, tokenId, provider, chainId } = schema.parse(args);
      const metadata = await ethersService.getERC1155Metadata(
        contractAddress, 
        tokenId, 
        provider, 
        chainId
      );
      
      // Build a formatted response with all metadata properties
      let metadataText = `Token Metadata for ${contractAddress} (ID: ${tokenId}):`;
      
      if (metadata.name) metadataText += `\nName: ${metadata.name}`;
      if (metadata.description) metadataText += `\nDescription: ${metadata.description}`;
      if (metadata.image) metadataText += `\nImage URL: ${metadata.image}`;
      if (metadata.external_url) metadataText += `\nExternal URL: ${metadata.external_url}`;
      
      // Add attributes if they exist
      if (metadata.attributes && metadata.attributes.length > 0) {
        metadataText += '\n\nAttributes:';
        for (const attr of metadata.attributes) {
          if (attr.trait_type && attr.value !== undefined) {
            metadataText += `\n- ${attr.trait_type}: ${attr.value}`;
          }
        }
      }
      
      return {
        content: [{ 
          type: "text", 
          text: metadataText
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error getting token metadata: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  getERC1155TokensOfOwner: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      ownerAddress: z.string(),
      tokenIds: z.array(tokenIdSchema).optional(),
      includeMetadata: z.boolean().optional().default(false),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, ownerAddress, tokenIds, includeMetadata, provider, chainId } = schema.parse(args);
      const tokens = await ethersService.getERC1155TokensOfOwner(
        contractAddress, 
        ownerAddress, 
        tokenIds, 
        includeMetadata, 
        provider, 
        chainId
      );
      
      if (tokens.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `${ownerAddress} doesn't own any tokens in contract ${contractAddress}.`
          }]
        };
      }
      
      let responseText = `${ownerAddress} owns ${tokens.length} token type(s) in contract ${contractAddress}:`;
      
      for (const token of tokens) {
        responseText += `\n\nToken ID: ${token.tokenId}`;
        responseText += `\nBalance: ${token.balance}`;
        
        if (token.metadata) {
          if (token.metadata.name) responseText += `\nName: ${token.metadata.name}`;
          if (token.metadata.image) responseText += `\nImage URL: ${token.metadata.image}`;
          
          // Add a few attributes if they exist (limited to avoid very long responses)
          if (token.metadata.attributes && token.metadata.attributes.length > 0) {
            responseText += '\nAttributes:';
            const limit = Math.min(3, token.metadata.attributes.length);
            for (let i = 0; i < limit; i++) {
              const attr = token.metadata.attributes[i];
              if (attr.trait_type && attr.value !== undefined) {
                responseText += `\n- ${attr.trait_type}: ${attr.value}`;
              }
            }
            if (token.metadata.attributes.length > limit) {
              responseText += `\n- ... ${token.metadata.attributes.length - limit} more attributes`;
            }
          }
        }
      }
      
      return {
        content: [{ 
          type: "text", 
          text: responseText
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error getting tokens owned by address: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  safeTransferERC1155: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      fromAddress: z.string(),
      toAddress: z.string(),
      tokenId: tokenIdSchema,
      amount: amountSchema,
      data: z.string().optional().default('0x'),
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { contractAddress, fromAddress, toAddress, tokenId, amount, data, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.safeTransferERC1155(
        contractAddress, 
        fromAddress,
        toAddress, 
        tokenId, 
        amount,
        data,
        provider, 
        chainId,
        options
      );
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${amount} of token ID ${tokenId} from ${fromAddress} to ${toAddress}.\nTransaction Hash: ${tx.hash}`
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
  
  safeBatchTransferERC1155: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      fromAddress: z.string(),
      toAddress: z.string(),
      tokenIds: z.array(tokenIdSchema),
      amounts: z.array(amountSchema),
      data: z.string().optional().default('0x'),
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { contractAddress, fromAddress, toAddress, tokenIds, amounts, data, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Validate arrays have the same length
      if (tokenIds.length !== amounts.length) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: "Error: tokenIds and amounts arrays must have the same length"
          }]
        };
      }
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.safeBatchTransferERC1155(
        contractAddress, 
        fromAddress,
        toAddress, 
        tokenIds, 
        amounts,
        data,
        provider, 
        chainId,
        options
      );
      
      // Format the token transfers for the response
      let transfersText = '';
      for (let i = 0; i < tokenIds.length; i++) {
        transfersText += `\n- ${amounts[i]} of token ID ${tokenIds[i]}`;
      }
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully batch transferred the following tokens from ${fromAddress} to ${toAddress}:${transfersText}\n\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error batch transferring tokens: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}; 