/**
 * @file ERC1155 Tool Definitions
 * @version 1.0.0
 * 
 * Tool definitions for ERC1155 multi-token standard operations
 */

export const erc1155Tools = [
  {
    name: "getERC1155Balance",
    description: "Get the balance of a specific token ID for an address in an ERC1155 contract",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address whose balance to check"
        },
        tokenId: {
          type: "string",
          description: "The ID of the token"
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
      required: ["contractAddress", "ownerAddress", "tokenId"]
    }
  },
  {
    name: "getERC1155BatchBalances",
    description: "Get balances for multiple token IDs or owners in an ERC1155 contract",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        ownerAddresses: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of Ethereum addresses whose balances to check"
        },
        tokenIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of token IDs to check"
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
      required: ["contractAddress", "ownerAddresses", "tokenIds"]
    }
  },
  {
    name: "getERC1155Metadata",
    description: "Get and parse the metadata for a specific token ID in an ERC1155 contract",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        tokenId: {
          type: "string",
          description: "The ID of the token"
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
    name: "getERC1155TokensOfOwner",
    description: "Get all tokens owned by an address in an ERC1155 contract, with optional metadata",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address of the token owner"
        },
        tokenIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Optional. Specific token IDs to check. If not provided, will attempt to detect all tokens owned."
        },
        includeMetadata: {
          type: "boolean",
          description: "Optional. Whether to include full metadata for each token. Default is false."
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
    name: "safeTransferERC1155",
    description: "Safely transfer tokens from the connected wallet to another address",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        fromAddress: {
          type: "string",
          description: "The Ethereum address to send tokens from (must be the connected wallet or have approval)"
        },
        toAddress: {
          type: "string",
          description: "The Ethereum address to receive the tokens"
        },
        tokenId: {
          type: "string",
          description: "The ID of the token to transfer"
        },
        amount: {
          type: "string",
          description: "The amount of tokens to transfer"
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
      required: ["contractAddress", "fromAddress", "toAddress", "tokenId", "amount"]
    }
  },
  {
    name: "safeBatchTransferERC1155",
    description: "Safely transfer multiple tokens from the connected wallet to another address in a single transaction",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the ERC1155 token contract"
        },
        fromAddress: {
          type: "string",
          description: "The Ethereum address to send tokens from (must be the connected wallet or have approval)"
        },
        toAddress: {
          type: "string",
          description: "The Ethereum address to receive the tokens"
        },
        tokenIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of token IDs to transfer"
        },
        amounts: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of amounts to transfer, corresponding to each token ID"
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
      required: ["contractAddress", "fromAddress", "toAddress", "tokenIds", "amounts"]
    }
  }
]; 