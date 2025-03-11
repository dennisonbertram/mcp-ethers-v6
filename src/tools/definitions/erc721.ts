/**
 * @file ERC721 Tool Definitions
 * @version 1.0.0
 * 
 * Tool definitions for ERC721 NFT standard operations
 */

export const erc721Tools = [
  {
    name: "getERC721CollectionInfo",
    description: "Get basic information about an NFT collection including name and symbol",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        }
      },
      required: ["contractAddress"]
    }
  },
  {
    name: "getERC721Owner",
    description: "Get the current owner of a specific NFT token",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        tokenId: {
          type: "string",
          description: "The ID of the NFT token"
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        }
      },
      required: ["contractAddress", "tokenId"]
    }
  },
  {
    name: "getERC721Metadata",
    description: "Get and parse the metadata for a specific NFT token, including name, description, image URL, and attributes",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        tokenId: {
          type: "string",
          description: "The ID of the NFT token"
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        }
      },
      required: ["contractAddress", "tokenId"]
    }
  },
  {
    name: "getERC721TokensOfOwner",
    description: "Get all NFTs owned by an address in a specific collection, with optional metadata",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address of the NFT owner"
        },
        includeMetadata: {
          type: "boolean",
          description: "Optional. Whether to include full metadata for each NFT. Default is false."
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        }
      },
      required: ["contractAddress", "ownerAddress"]
    }
  },
  {
    name: "transferERC721",
    description: "Transfer an NFT from the connected wallet to another address",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        toAddress: {
          type: "string",
          description: "The Ethereum address to receive the NFT"
        },
        tokenId: {
          type: "string",
          description: "The ID of the NFT token to transfer"
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        },
        gasLimit: {
          type: "string",
          description: "Optional. The gas limit for the transaction"
        },
        gasPrice: {
          type: "string",
          description: "Optional. The gas price for the transaction in gwei"
        }
      },
      required: ["contractAddress", "toAddress", "tokenId"]
    }
  },
  {
    name: "safeTransferERC721",
    description: "Safely transfer an NFT from the connected wallet to another address, with additional data",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC721 NFT contract"
        },
        toAddress: {
          type: "string",
          description: "The Ethereum address to receive the NFT"
        },
        tokenId: {
          type: "string",
          description: "The ID of the NFT token to transfer"
        },
        data: {
          type: "string",
          description: "Optional. Additional data to send with the transfer, encoded as a hex string. Default is '0x'."
        },
        provider: {
          type: "string",
          description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks."
        },
        chainId: {
          type: "number",
          description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used."
        },
        gasLimit: {
          type: "string",
          description: "Optional. The gas limit for the transaction"
        },
        gasPrice: {
          type: "string",
          description: "Optional. The gas price for the transaction in gwei"
        }
      },
      required: ["contractAddress", "toAddress", "tokenId"]
    }
  }
]; 