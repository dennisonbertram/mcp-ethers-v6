/**
 * @file ERC721 Tool Handlers
 * @version 1.0.0
 * 
 * Tool handlers for ERC721 NFT standard operations
 */

import { z } from 'zod';
import { TokenOperationOptions } from '../../services/erc/types.js';

// This will be injected during initialization
let ethersService: any;

export function initializeErc721Handlers(service: any) {
  ethersService = service;
}

// Common schemas for repeated use
const contractAddressSchema = z.string();
const providerSchema = z.string().optional();
const chainIdSchema = z.number().optional();
const tokenIdSchema = z.union([z.string(), z.number()]);

// Options schema for transaction operations
const optionsSchema = z.object({
  gasLimit: z.union([z.string(), z.number()]).optional(),
  gasPrice: z.union([z.string(), z.number()]).optional(),
  maxFeePerGas: z.union([z.string(), z.number()]).optional(),
  maxPriorityFeePerGas: z.union([z.string(), z.number()]).optional(),
  nonce: z.number().optional(),
  value: z.string().optional(),
}).optional();

export const erc721Handlers = {
  getERC721CollectionInfo: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, provider, chainId } = schema.parse(args);
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `NFT Collection Information:
Name: ${collectionInfo.name}
Symbol: ${collectionInfo.symbol}${collectionInfo.totalSupply ? `
Total Supply: ${collectionInfo.totalSupply}` : ''}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error getting NFT collection information: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  getERC721Owner: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, tokenId, provider, chainId } = schema.parse(args);
      const owner = await ethersService.getERC721Owner(contractAddress, tokenId, provider, chainId);
      
      // Get collection info to add context
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `The owner of ${collectionInfo.name} #${tokenId} is ${owner}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error getting NFT owner: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  getERC721Metadata: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, tokenId, provider, chainId } = schema.parse(args);
      const metadata = await ethersService.getERC721Metadata(contractAddress, tokenId, provider, chainId);
      
      // Get collection info to add context
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      // Build a formatted response with all metadata properties
      let metadataText = `NFT Metadata for ${collectionInfo.name} #${tokenId}:`;
      
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
          text: `Error getting NFT metadata: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  getERC721TokensOfOwner: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      ownerAddress: z.string(),
      includeMetadata: z.boolean().optional().default(false),
      provider: providerSchema,
      chainId: chainIdSchema
    });
    
    try {
      const { contractAddress, ownerAddress, includeMetadata, provider, chainId } = schema.parse(args);
      const tokens = await ethersService.getERC721TokensOfOwner(
        contractAddress, 
        ownerAddress, 
        includeMetadata, 
        provider, 
        chainId
      );
      
      // Get collection info to add context
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      if (tokens.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `${ownerAddress} doesn't own any tokens in the ${collectionInfo.name} collection.`
          }]
        };
      }
      
      let responseText = `${ownerAddress} owns ${tokens.length} token(s) in the ${collectionInfo.name} collection:`;
      
      for (const token of tokens) {
        responseText += `\n\nToken ID: ${token.tokenId}`;
        
        if (token.metadata) {
          if (token.metadata.name) responseText += `\nName: ${token.metadata.name}`;
          if (token.metadata.image) responseText += `\nImage URL: ${token.metadata.image}`;
          
          // Add a few attributes if they exist (limited to avoid very long responses)
          if (token.metadata.attributes && token.metadata.attributes.length > 0) {
            responseText += '\nAttributes:';
            const limit = Math.min(5, token.metadata.attributes.length);
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
          text: `Error getting NFTs owned by address: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  transferERC721: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      toAddress: z.string(),
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { contractAddress, toAddress, tokenId, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.transferERC721(
        contractAddress, 
        toAddress, 
        tokenId, 
        provider, 
        chainId,
        options
      );
      
      // Get collection info to add context
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully transferred ${collectionInfo.name} #${tokenId} to ${toAddress}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error transferring NFT: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
  
  safeTransferERC721: async (args: unknown) => {
    const schema = z.object({
      contractAddress: contractAddressSchema,
      toAddress: z.string(),
      tokenId: tokenIdSchema,
      data: z.string().optional().default('0x'),
      provider: providerSchema,
      chainId: chainIdSchema,
      gasLimit: z.string().optional(),
      gasPrice: z.string().optional(),
    });
    
    try {
      const { contractAddress, toAddress, tokenId, data, provider, chainId, gasLimit, gasPrice } = schema.parse(args);
      
      // Create options object for transaction parameters
      const options: TokenOperationOptions = {};
      if (gasLimit) options.gasLimit = gasLimit;
      if (gasPrice) options.gasPrice = gasPrice;
      
      const tx = await ethersService.safeTransferERC721(
        contractAddress, 
        toAddress, 
        tokenId, 
        data,
        provider, 
        chainId,
        options
      );
      
      // Get collection info to add context
      const collectionInfo = await ethersService.getERC721CollectionInfo(contractAddress, provider, chainId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully safe-transferred ${collectionInfo.name} #${tokenId} to ${toAddress}.\nTransaction Hash: ${tx.hash}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ 
          type: "text", 
          text: `Error safe-transferring NFT: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}; 