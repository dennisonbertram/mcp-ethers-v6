/**
 * @file ERC721 Tools Module
 * @version 1.0.0
 * @status UNDER DEVELOPMENT
 * @lastModified 2024-03-19
 * 
 * MCP tools for interacting with ERC721 NFT tokens
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EthersService } from '../services/ethersService.js';
import { 
  getNFTInfo,
  ownerOf,
  getTokenURI,
  getMetadata,
  transferNFT,
  approve,
  setApprovalForAll
} from '../services/erc/erc721.js';
import { TokenOperationOptions } from '../services/erc/types.js';
import { silentLogger } from '../utils/silentLogger.js';

// Common schemas
const contractAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const providerSchema = z.string().optional();
const chainIdSchema = z.number().optional();
const tokenIdSchema = z.union([z.string(), z.number()]);
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const gasOptionsSchema = z.object({
  gasLimit: z.number().optional(),
  gasPrice: z.number().optional(),
  maxFeePerGas: z.number().optional(),
  maxPriorityFeePerGas: z.number().optional(),
  nonce: z.number().optional(),
  value: z.string().optional()
}).optional();

// Parameter types
type GetNFTInfoParams = {
  contractAddress: string;
  provider?: string;
  chainId?: number;
};

type GetNFTOwnerParams = {
  contractAddress: string;
  tokenId: string | number;
  provider?: string;
  chainId?: number;
};

type GetNFTTokenURIParams = {
  contractAddress: string;
  tokenId: string | number;
  provider?: string;
  chainId?: number;
};

type GetNFTMetadataParams = {
  contractAddress: string;
  tokenId: string | number;
  provider?: string;
  chainId?: number;
};

type TransferNFTParams = {
  contractAddress: string;
  tokenId: string | number;
  from: string;
  to: string;
  provider?: string;
  chainId?: number;
  gasOptions?: TokenOperationOptions;
};

type ApproveNFTParams = {
  contractAddress: string;
  tokenId: string | number;
  owner: string;
  approved: string;
  provider?: string;
  chainId?: number;
  gasOptions?: TokenOperationOptions;
};

type SetNFTApprovalForAllParams = {
  contractAddress: string;
  owner: string;
  operator: string;
  approved: boolean;
  provider?: string;
  chainId?: number;
  gasOptions?: TokenOperationOptions;
};

/**
 * Register ERC721 tools with the MCP server
 */
export function registerERC721Tools(server: McpServer, ethersService: EthersService) {
  // Get NFT Collection Info
  server.tool(
    "getNFTInfo",
    {
      contractAddress: contractAddressSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async ({ contractAddress, provider, chainId }) => {
      try {
        const info = await getNFTInfo(ethersService, contractAddress, provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `NFT Collection Information:
Name: ${info.name}
Symbol: ${info.symbol}
${info.totalSupply ? `Total Supply: ${info.totalSupply}` : 'Total Supply: Not available'}`
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
    }
  );

  // Get NFT Owner
  server.tool(
    "getNFTOwner",
    {
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async ({ contractAddress, tokenId, provider, chainId }) => {
      try {
        const owner = await ownerOf(ethersService, contractAddress, tokenId.toString(), provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `NFT #${tokenId} is owned by ${owner}`
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
    }
  );

  // Get NFT Token URI
  server.tool(
    "getNFTTokenURI",
    {
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async ({ contractAddress, tokenId, provider, chainId }) => {
      try {
        const tokenURI = await getTokenURI(ethersService, contractAddress, tokenId.toString(), provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `NFT #${tokenId} has token URI: ${tokenURI}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error getting token URI: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get NFT Metadata
  server.tool(
    "getNFTMetadata",
    {
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      provider: providerSchema,
      chainId: chainIdSchema
    },
    async ({ contractAddress, tokenId, provider, chainId }) => {
      try {
        const metadata = await getMetadata(ethersService, contractAddress, tokenId.toString(), provider, chainId);
        return {
          content: [{ 
            type: "text", 
            text: `NFT #${tokenId} Metadata:
Name: ${metadata.name || 'No name available'}
Description: ${metadata.description || 'No description available'}
Image URL: ${metadata.image || 'No image available'}`
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
    }
  );

  // Transfer NFT
  server.tool(
    "transferNFT",
    {
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      to: addressSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasOptions: gasOptionsSchema
    },
    async ({ contractAddress, tokenId, to, provider, chainId, gasOptions }) => {
      try {
        const tx = await transferNFT(ethersService, contractAddress, to, tokenId.toString(), provider, chainId, gasOptions);
        return {
          content: [{ 
            type: "text", 
            text: `Successfully initiated transfer of NFT #${tokenId} to ${to}
Transaction Hash: ${tx.hash}
Waiting for confirmation...`
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
    }
  );

  // Approve NFT
  server.tool(
    "approveNFT",
    {
      contractAddress: contractAddressSchema,
      tokenId: tokenIdSchema,
      approved: addressSchema,
      provider: providerSchema,
      chainId: chainIdSchema,
      gasOptions: gasOptionsSchema
    },
    async ({ contractAddress, tokenId, approved, provider, chainId, gasOptions }) => {
      try {
        const tx = await approve(ethersService, contractAddress, approved, tokenId.toString(), provider, chainId, gasOptions);
        return {
          content: [{ 
            type: "text", 
            text: `Successfully approved ${approved} to transfer NFT #${tokenId}
Transaction Hash: ${tx.hash}
Waiting for confirmation...`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error approving NFT transfer: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Set Approval For All
  server.tool(
    "setNFTApprovalForAll",
    {
      contractAddress: contractAddressSchema,
      operator: addressSchema,
      approved: z.boolean(),
      provider: providerSchema,
      chainId: chainIdSchema,
      gasOptions: gasOptionsSchema
    },
    async ({ contractAddress, operator, approved, provider, chainId, gasOptions }) => {
      try {
        const tx = await setApprovalForAll(ethersService, contractAddress, operator, approved, provider, chainId, gasOptions);
        return {
          content: [{ 
            type: "text", 
            text: `Successfully ${approved ? 'approved' : 'revoked approval for'} ${operator} to manage all your NFTs from collection ${contractAddress}
Transaction Hash: ${tx.hash}
Waiting for confirmation...`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ 
            type: "text", 
            text: `Error setting approval for all: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
} 