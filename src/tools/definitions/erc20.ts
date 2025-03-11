/**
 * @file ERC20 Tool Definitions
 * @version 1.0.0
 * 
 * Tool definitions for ERC20 token standard operations
 */

export const erc20Tools = [
  {
    name: "getERC20TokenInfo",
    description: "Get basic information about an ERC20 token including name, symbol, decimals, and total supply",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
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
      required: ["tokenAddress"]
    }
  },
  {
    name: "getERC20Balance",
    description: "Get the ERC20 token balance of a wallet",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address whose balance to check"
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
      required: ["tokenAddress", "ownerAddress"]
    }
  },
  {
    name: "getERC20Allowance",
    description: "Get the amount of tokens approved for a spender to use from an owner's account",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address that owns the tokens"
        },
        spenderAddress: {
          type: "string",
          description: "The Ethereum address that is approved to spend tokens"
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
      required: ["tokenAddress", "ownerAddress", "spenderAddress"]
    }
  },
  {
    name: "transferERC20",
    description: "Transfer ERC20 tokens from the connected wallet to another address",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
        },
        recipientAddress: {
          type: "string",
          description: "The Ethereum address to receive the tokens"
        },
        amount: {
          type: "string",
          description: "The amount of tokens to transfer (can be decimal, e.g. '1.5')"
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
      required: ["tokenAddress", "recipientAddress", "amount"]
    }
  },
  {
    name: "approveERC20",
    description: "Approve a spender to use a certain amount of your ERC20 tokens",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
        },
        spenderAddress: {
          type: "string",
          description: "The Ethereum address to approve for spending tokens"
        },
        amount: {
          type: "string",
          description: "The amount of tokens to approve (can be decimal, e.g. '1.5')"
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
      required: ["tokenAddress", "spenderAddress", "amount"]
    }
  },
  {
    name: "transferFromERC20",
    description: "Transfer ERC20 tokens from one address to another (requires approval)",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract"
        },
        senderAddress: {
          type: "string",
          description: "The Ethereum address to send tokens from (must have approved the connected wallet)"
        },
        recipientAddress: {
          type: "string",
          description: "The Ethereum address to receive the tokens"
        },
        amount: {
          type: "string",
          description: "The amount of tokens to transfer (can be decimal, e.g. '1.5')"
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
      required: ["tokenAddress", "senderAddress", "recipientAddress", "amount"]
    }
  }
]; 