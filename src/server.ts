import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { EthersService } from "./services/ethersService.js";
import { DefaultProvider } from "./config/networks.js";
import { z } from "zod";
import { config } from "dotenv";
import { ethers } from "ethers";
import { logger } from "./utils/logger.js";

// Comment out the imports that no longer exist in the refactored version
// import { allTools, allHandlers } from "./tools/index.js";
import { initializeErc20Handlers } from "./tools/handlers/erc20.js";
import { initializeErc721Handlers } from "./tools/handlers/erc721.js";
import { initializeErc1155Handlers } from "./tools/handlers/erc1155.js";

// Import legacy tool definitions directly to maintain backward compatibility during refactoring
import { erc20Tools } from './tools/definitions/erc20.js';
import { erc721Tools } from './tools/definitions/erc721.js';
import { erc1155Tools } from './tools/definitions/erc1155.js';
import { erc20Handlers } from './tools/handlers/erc20.js';
import { erc721Handlers } from './tools/handlers/erc721.js';
import { erc1155Handlers } from './tools/handlers/erc1155.js';

config(); // Load environment variables

// Define schemas for contract calls
const contractCallSchema = z.object({
  contractAddress: z.string(),
  abi: z.union([z.string(), z.array(z.string())]),
  method: z.string(),
  methodArgs: z.array(z.any()).optional(),
  provider: z.string().optional(),
  chainId: z.number().optional(),
});

const contractCallViewSchema = z.object({
  address: z.string(),
  abi: z.union([z.string(), z.array(z.string())]),
  method: z.string(),
  args: z.array(z.any()).optional(),
  provider: z.string().optional(),
  chainId: z.number().optional(),
});

const server = new Server(
  {
    name: "ethers-wallet-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize the ethers service with configurable default network
const defaultNetworkInput = process.env.DEFAULT_NETWORK || "mainnet";
// Convert common network names to the official names used in DefaultProvider
const networkAliasMap: Record<string, DefaultProvider> = {
  mainnet: "Ethereum",
  ethereum: "Ethereum",
  polygon: "Polygon PoS",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  avalanche: "Avalanche C-Chain",
  base: "Base",
};
const defaultNetwork =
  networkAliasMap[defaultNetworkInput.toLowerCase()] ||
  (defaultNetworkInput as DefaultProvider);

// Create provider with the correct network name
const provider = new ethers.AlchemyProvider(
  defaultNetwork === "Ethereum"
    ? "mainnet"
    : defaultNetwork.toLowerCase().replace(" ", "-"),
  process.env.ALCHEMY_API_KEY
);
const ethersService = new EthersService(provider);

// Initialize handlers with ethersService
initializeErc20Handlers(ethersService);
initializeErc721Handlers(ethersService);
initializeErc1155Handlers(ethersService);

// Create allTools and allHandlers for backward compatibility
const allTools = [
  ...erc20Tools,
  ...erc721Tools,
  ...erc1155Tools
];

const allHandlers = {
  ...erc20Handlers,
  ...erc721Handlers,
  ...erc1155Handlers
};

// Define existing tools
const existingTools = [
  {
    name: "getSupportedNetworks",
    description:
      "Get a list of all supported networks and their configurations. Shows which network is the default (used when no provider is specified). Call this first to discover available networks before using other network-related functions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "generateWallet",
    description:
      "Generate a new Ethereum wallet with a random private key. Returns the wallet address and private key. IMPORTANT: Store the private key securely as it provides full control over the wallet.",
    inputSchema: {
      type: "object",
      properties: {
        saveToEnv: {
          type: "boolean",
          description:
            "Optional. If true, the private key will be saved to the server's environment variables for future use. Default is false.",
        },
      },
    },
  },
  {
    name: "loadWallet",
    description:
      "Load an existing wallet from a private key. The wallet will be used for all transactions in the current session. IMPORTANT: Transmitting private keys is a security risk. Use with caution.",
    inputSchema: {
      type: "object",
      properties: {
        privateKey: {
          type: "string",
          description:
            "The private key of the wallet to load. Should start with '0x'.",
        },
        saveToEnv: {
          type: "boolean",
          description:
            "Optional. If true, the private key will be saved to the server's environment variables for this session. Default is true.",
        },
      },
      required: ["privateKey"],
    },
  },
  {
    name: "ethSign",
    description:
      "Signs data using the Ethereum eth_sign method (legacy). IMPORTANT: This is less secure than signMessage as it can sign transaction-like data. Use with caution.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description:
            "The data to sign. Will be converted to hex if not already in hex format.",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "checkWalletExists",
    description:
      "Check if there is a wallet configured on the server. Returns basic wallet info like address but never exposes private keys.",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks. If not provided, uses the default network.",
        },
      },
    },
  },
  {
    name: "getWalletBalance",
    description: "Get the ETH balance of a wallet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address to query",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "getWalletTransactionCount",
    description: "Get the number of transactions ever sent by an address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address to query",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "getBlockNumber",
    description: "Get the current block number",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
    },
  },
  {
    name: "getBlockDetails",
    description: "Get details about a block",
    inputSchema: {
      type: "object",
      properties: {
        blockTag: {
          type: ["string", "number"],
          description: "The block number or the string 'latest'",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["blockTag"],
    },
  },
  {
    name: "getTransactionDetails",
    description: "Get details about a transaction",
    inputSchema: {
      type: "object",
      properties: {
        txHash: {
          type: "string",
          description: "The transaction hash to lookup",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["txHash"],
    },
  },
  {
    name: "getGasPrice",
    description: "Get the current gas price",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
    },
  },
  {
    name: "getFeeData",
    description: "Get the current network fee data",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
    },
  },
  {
    name: "getContractCode",
    description: "Get a contract's bytecode",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The contract's address",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "lookupAddress",
    description: "Get the ENS name for an address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address to resolve",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "resolveName",
    description: "Get the address for an ENS name",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The ENS name to resolve",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "formatEther",
    description: "Convert a wei value to a decimal string in ether",
    inputSchema: {
      type: "object",
      properties: {
        wei: {
          type: "string",
          description: "The wei value to format",
        },
      },
      required: ["wei"],
    },
  },
  {
    name: "parseEther",
    description: "Convert an ether value to wei",
    inputSchema: {
      type: "object",
      properties: {
        ether: {
          type: "string",
          description: "The ether value to parse",
        },
      },
      required: ["ether"],
    },
  },
  {
    name: "formatUnits",
    description: "Convert a value to a decimal string with specified units",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "The value to format",
        },
        unit: {
          type: ["string", "number"],
          description: "The number of decimals or unit name (e.g., 'gwei', 18)",
        },
      },
      required: ["value", "unit"],
    },
  },
  {
    name: "parseUnits",
    description: "Convert a decimal string to its smallest unit representation",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "The decimal string to parse",
        },
        unit: {
          type: ["string", "number"],
          description: "The number of decimals or unit name (e.g., 'gwei', 18)",
        },
      },
      required: ["value", "unit"],
    },
  },
  {
    name: "sendTransaction",
    description: "Send ETH from the server's wallet to a recipient",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient address",
        },
        value: {
          type: "string",
          description: "The amount of ETH to send",
        },
        data: {
          type: "string",
          description: "Optional. Data to include in the transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["to", "value"],
    },
  },
  {
    name: "signMessage",
    description: "Sign a message using the server's wallet",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to sign",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "contractCall",
    description:
      "Call a view/pure method on a smart contract (read-only operations)",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the contract to call",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The name of the method to call",
        },
        args: {
          type: "array",
          description: "The arguments to pass to the method",
          items: { type: "any" },
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use for the call. If provided, will verify it matches the provider's network.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractCallView",
    description:
      "Call a view/pure method on a smart contract (read-only operations)",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the contract to call",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description:
            "The name of the method to call (must be a view/pure function)",
        },
        args: {
          type: "array",
          description: "The arguments to pass to the method",
          items: { type: "any" },
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use for the call. If provided, will verify it matches the provider's network.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractCallWithEstimate",
    description:
      "Call a method on a smart contract with automatic gas estimation",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the smart contract",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The method name to invoke",
        },
        methodArgs: {
          type: "array",
          description: "An array of arguments to pass to the method",
          items: {
            type: ["string", "number", "boolean", "object"],
          },
        },
        value: {
          type: "string",
          description: "Optional. The amount of ETH to send with the call",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractSendTransaction",
    description:
      "Call a method on a smart contract and send a transaction with custom parameters",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the smart contract",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The method name to invoke",
        },
        methodArgs: {
          type: "array",
          description: "An array of arguments to pass to the method",
          items: {
            type: ["string", "number", "boolean", "object"],
          },
        },
        value: {
          type: "string",
          description: "Optional. The amount of ETH to send with the call",
        },
        gasLimit: {
          type: "string",
          description: "Optional. The gas limit for the transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractSendTransactionWithEstimate",
    description:
      "Call a method on a smart contract and send a transaction with automatic gas estimation",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the smart contract",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The method name to invoke",
        },
        methodArgs: {
          type: "array",
          description: "An array of arguments to pass to the method",
          items: {
            type: ["string", "number", "boolean", "object"],
          },
        },
        value: {
          type: "string",
          description: "Optional. The amount of ETH to send with the call",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractCallWithOverrides",
    description: "Call a method on a smart contract with advanced options",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the smart contract",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The method name to invoke",
        },
        methodArgs: {
          type: "array",
          description: "An array of arguments to pass to the method",
          items: {
            type: ["string", "number", "boolean", "object"],
          },
        },
        value: {
          type: "string",
          description: "Optional. The amount of ETH to send with the call",
        },
        gasLimit: {
          type: "string",
          description: "Optional. A manual gas limit for the transaction",
        },
        gasPrice: {
          type: "string",
          description: "Optional. A manual gas price for legacy transactions",
        },
        nonce: {
          type: "number",
          description: "Optional. A manual nonce for the transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "contractSendTransactionWithOverrides",
    description:
      "Call a method on a smart contract and send a transaction with custom parameters",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the smart contract",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        method: {
          type: "string",
          description: "The method name to invoke",
        },
        methodArgs: {
          type: "array",
          description: "An array of arguments to pass to the method",
          items: {
            type: ["string", "number", "boolean", "object"],
          },
        },
        value: {
          type: "string",
          description: "Optional. The amount of ETH to send with the call",
        },
        gasLimit: {
          type: "string",
          description: "Optional. The gas limit for the transaction",
        },
        gasPrice: {
          type: "string",
          description: "Optional. A manual gas price for legacy transactions",
        },
        nonce: {
          type: "number",
          description: "Optional. A manual nonce for the transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi", "method"],
    },
  },
  {
    name: "sendRawTransaction",
    description: "Send a raw transaction",
    inputSchema: {
      type: "object",
      properties: {
        signedTransaction: {
          type: "string",
          description: "A fully serialized and signed transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["signedTransaction"],
    },
  },
  {
    name: "queryLogs",
    description: "Query historical logs",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The contract address emitting the events (optional).",
        },
        topics: {
          type: "array",
          description:
            "A list of topics to filter by. Each item can be a string, null, or an array of strings (optional)",
          items: {
            type: ["string", "null", "array"],
            items: { type: "string" },
          },
        },
        fromBlock: {
          type: ["string", "number"],
          description: "The starting block number (optional).",
        },
        toBlock: {
          type: ["string", "number"],
          description: "The ending block number (optional).",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
    },
  },
  {
    name: "contractEvents",
    description: "Query historical events from a contract",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "The address of the contract to query events from",
        },
        abi: {
          type: "string",
          description: "The ABI of the contract as a JSON string",
        },
        eventName: {
          type: "string",
          description: "The name of the event to look for. (Optional).",
        },
        topics: {
          type: "array",
          description:
            "A list of topics to filter by. Each item can be a string, null, or an array of strings (optional)",
          items: {
            type: ["string", "null", "array"],
            items: { type: "string" },
          },
        },
        fromBlock: {
          type: ["string", "number"],
          description: "The starting block number (optional).",
        },
        toBlock: {
          type: ["string", "number"],
          description: "The ending block number (optional).",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
      },
      required: ["contractAddress", "abi"],
    },
  },
  {
    name: "sendTransactionWithOptions",
    description:
      "Send a transaction with advanced options including gas limit, gas price, and nonce",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient address",
        },
        value: {
          type: "string",
          description: "The amount of ETH to send",
        },
        data: {
          type: "string",
          description: "Optional. Data to include in the transaction",
        },
        gasLimit: {
          type: "string",
          description: "Optional. The gas limit for the transaction",
        },
        gasPrice: {
          type: "string",
          description: "Optional. The gas price in gwei",
        },
        nonce: {
          type: "number",
          description: "Optional. The nonce to use for the transaction",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use for the transaction. If provided, will verify it matches the provider's network.",
        },
      },
      required: ["to", "value"],
    },
  },
  {
    name: "getTransactionsByBlock",
    description: "Get details about transactions in a specific block.",
    inputSchema: {
      type: "object",
      properties: {
        blockTag: {
          type: ["string", "number"],
          description: "The block number or the string 'latest'",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        },
      },
      required: ["blockTag"],
    },
  },
  // ERC20 Token Tools
  {
    name: "erc20_balanceOf",
    description: "Get the ERC20 token balance of a wallet",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract",
        },
        ownerAddress: {
          type: "string",
          description: "The Ethereum address whose balance to check",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        }
      },
      required: ["tokenAddress", "ownerAddress"],
    },
  },
  {
    name: "erc20_getTokenInfo",
    description: "Get basic information about an ERC20 token including name, symbol, decimals, and total supply",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The address of the ERC20 token contract",
        },
        provider: {
          type: "string",
          description:
            "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
        },
        chainId: {
          type: "number",
          description:
            "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
        }
      },
      required: ["tokenAddress"],
    },
  },
];

// Combine all tools
const tools = [...existingTools, ...allTools];

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Define existing handlers
const existingHandlers = {
  getWalletBalance: async (args: unknown) => {
    const schema = z.object({
      address: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });
    const { address, provider, chainId } = schema.parse(args);
    const balance = await ethersService.getBalance(address, provider, chainId);
    return {
      content: [
        { type: "text", text: `The balance of ${address} is ${balance} ETH` },
      ],
    };
  },

  getWalletTransactionCount: async (args: unknown) => {
    const schema = z.object({
      address: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });
    const { address, provider, chainId } = schema.parse(args);
    const count = await ethersService.getTransactionCount(
      address,
      provider,
      chainId
    );
    return {
      content: [
        {
          type: "text",
          text: `The transaction count for ${address} is ${count}`,
        },
      ],
    };
  },

  getBlockNumber: async (args: unknown) => {
    const schema = z.object({
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });
    const { provider, chainId } = schema.parse(args);
    const blockNumber = await ethersService.getBlockNumber(provider, chainId);
    return {
      content: [
        { type: "text", text: `The current block number is ${blockNumber}` },
      ],
    };
  },

  getSupportedNetworks: async (args: unknown) => {
    const networks = ethersService.getSupportedNetworks();
    return {
      content: [{ type: "text", text: JSON.stringify(networks, null, 2) }],
    };
  },

  generateWallet: async (args: unknown) => {
    const schema = z.object({
      saveToEnv: z.boolean().optional().default(false),
    });

    try {
      const { saveToEnv } = schema.parse(args);

      // Generate a new random wallet
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const privateKey = wallet.privateKey;

      // If saveToEnv is true, save the private key to process.env
      // Note: This only persists for the current session
      if (saveToEnv) {
        process.env.PRIVATE_KEY = privateKey;

        // Update the ethersService with the new wallet
        const signer = new ethers.Wallet(privateKey, ethersService.provider);
        ethersService.setSigner(signer);
      }

      return {
        content: [
          {
            type: "text",
            text: `New wallet generated:\n\nAddress: ${address}\nPrivate Key: ${privateKey}\n\n${
              saveToEnv
                ? "The private key has been saved to the server's environment for this session. It will be used for transactions until the server restarts."
                : "IMPORTANT: Save this private key securely. It has NOT been saved on the server."
            }\n\nTo use this wallet permanently, add this private key to your .env file as PRIVATE_KEY=${privateKey}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error generating wallet: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  loadWallet: async (args: unknown) => {
    const schema = z.object({
      privateKey: z
        .string()
        .refine((key) => key.startsWith("0x") && key.length === 66, {
          message:
            "Invalid private key format. Must start with '0x' and be 66 characters long.",
        }),
      saveToEnv: z.boolean().optional().default(true),
    });

    try {
      const { privateKey, saveToEnv } = schema.parse(args);

      // Create a wallet from the private key
      const wallet = new ethers.Wallet(privateKey, ethersService.provider);
      const address = wallet.address;

      // Set the wallet as the signer for ethersService
      ethersService.setSigner(wallet);

      // Optionally save to environment variables (in-memory only)
      if (saveToEnv) {
        process.env.PRIVATE_KEY = privateKey;
      }

      return {
        content: [
          {
            type: "text",
            text: `Wallet loaded successfully!\n\nAddress: ${address}\n\nThis wallet will be used for all transactions in the current session${
              saveToEnv
                ? " and has been saved to the server's environment variables for this session"
                : ""
            }.\n\nIMPORTANT: The wallet will only persist until the server is restarted.`,
          },
        ],
      };
    } catch (error) {
      // Sanitize error message to ensure it doesn't contain the private key
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("0x")) {
        errorMessage = errorMessage.replace(
          /0x[a-fA-F0-9]{64}/g,
          "[PRIVATE_KEY_REDACTED]"
        );
      }

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error loading wallet: ${errorMessage}`,
          },
        ],
      };
    }
  },

  checkWalletExists: async (args: unknown) => {
    const schema = z.object({
      provider: z.string().optional(),
    });
    const { provider } = schema.parse(args);

    try {
      const walletInfo = await ethersService.getWalletInfo(provider);
      if (!walletInfo) {
        return {
          content: [
            {
              type: "text",
              text: "No wallet is currently configured on the server.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Wallet is configured with address: ${walletInfo.address}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error checking wallet: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  getFeeData: async (args: unknown) => {
    const schema = z.object({
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });

    try {
      const { provider, chainId } = schema.parse(args);
      const feeData = await ethersService.getFeeData(provider, chainId);

      // Format the fee data in a more readable way
      const formattedFeeData = {
        gasPrice: feeData.gasPrice
          ? ethersService.formatUnits(feeData.gasPrice, "gwei") + " gwei"
          : null,
        maxFeePerGas: feeData.maxFeePerGas
          ? ethersService.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei"
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          ? ethersService.formatUnits(feeData.maxPriorityFeePerGas, "gwei") +
            " gwei"
          : null,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedFeeData, null, 2),
          },
        ],
      };
    } catch (error) {
      // Proper error handling according to MCP protocol
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting fee data: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  getGasPrice: async (args: unknown) => {
    const schema = z.object({
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });

    try {
      const { provider, chainId } = schema.parse(args);
      const gasPrice = await ethersService.getGasPrice(provider, chainId);

      // Format the gas price in gwei for readability
      const gasPriceGwei = ethersService.formatUnits(gasPrice, "gwei");

      return {
        content: [
          {
            type: "text",
            text: `Current gas price: ${gasPriceGwei} gwei`,
          },
        ],
      };
    } catch (error) {
      // Proper error handling according to MCP protocol
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting gas price: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  signMessage: async (args: unknown) => {
    const schema = z.object({
      message: z.string(),
      provider: z.string().optional(),
    });

    try {
      const { message, provider } = schema.parse(args);

      // Check if a wallet is configured
      const walletInfo = await ethersService.getWalletInfo(provider);
      if (!walletInfo) {
        throw new Error(
          "No wallet is configured. Please set up a wallet using loadWallet or generateWallet first."
        );
      }

      // Sign the message
      const signature = await ethersService.signMessage(message, provider);

      return {
        content: [
          {
            type: "text",
            text: `Message signed successfully!\n\nMessage: "${message}"\nSigner: ${walletInfo.address}\nSignature: ${signature}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error signing message: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  ethSign: async (args: unknown) => {
    const schema = z.object({
      data: z.string(),
      provider: z.string().optional(),
    });

    try {
      const { data, provider } = schema.parse(args);

      // Check if a wallet is configured
      const walletInfo = await ethersService.getWalletInfo(provider);
      if (!walletInfo) {
        throw new Error(
          "No wallet is configured. Please set up a wallet using loadWallet or generateWallet first."
        );
      }

      // Sign the data using eth_sign
      const signature = await ethersService.ethSign(data, provider);

      return {
        content: [
          {
            type: "text",
            text: `Data signed successfully using eth_sign!\n\nData: ${data}\nSigner: ${walletInfo.address}\nSignature: ${signature}\n\nWARNING: eth_sign is a legacy signing method and less secure than personal_sign. Use with caution.`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error signing data with eth_sign: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  getBlockDetails: async (args: unknown) => {
    const schema = z.object({
      blockTag: z.union([z.string(), z.number()]),
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });

    try {
      const { blockTag, provider, chainId } = schema.parse(args);
      const blockDetails = await ethersService.getBlockDetails(blockTag, provider, chainId);

      if (!blockDetails) {
        throw new Error(`Block not found: ${blockTag}`);
      }

      // Format the block data for display
      const formattedBlock = {
        number: blockDetails.number,
        hash: blockDetails.hash,
        parentHash: blockDetails.parentHash,
        timestamp: new Date(Number(blockDetails.timestamp) * 1000).toISOString(),
        miner: blockDetails.miner,
        gasLimit: blockDetails.gasLimit.toString(),
        gasUsed: blockDetails.gasUsed.toString(),
        baseFeePerGas: blockDetails.baseFeePerGas ? ethersService.formatUnits(blockDetails.baseFeePerGas, 'gwei') + ' gwei' : 'Not applicable',
        transactions: blockDetails.transactions.length
      };

      return {
        content: [
          {
            type: "text",
            text: `Block Details:
Number: ${formattedBlock.number}
Hash: ${formattedBlock.hash}
Parent Hash: ${formattedBlock.parentHash}
Timestamp: ${formattedBlock.timestamp}
Miner: ${formattedBlock.miner}
Gas Limit: ${formattedBlock.gasLimit}
Gas Used: ${formattedBlock.gasUsed}
Base Fee: ${formattedBlock.baseFeePerGas}
Transactions: ${formattedBlock.transactions} txs`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting block details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  getTransactionDetails: async (args: unknown) => {
    const schema = z.object({
      txHash: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional(),
    });

    try {
      const { txHash, provider, chainId } = schema.parse(args);
      const txDetails = await ethersService.getTransactionDetails(txHash, provider, chainId);

      if (!txDetails) {
        throw new Error(`Transaction not found: ${txHash}`);
      }

      // Format the transaction data for display
      const formattedTx = {
        hash: txDetails.hash,
        blockNumber: txDetails.blockNumber,
        blockHash: txDetails.blockHash,
        from: txDetails.from,
        to: txDetails.to || 'Contract Creation',
        value: ethersService.formatEther(txDetails.value),
        gasLimit: txDetails.gasLimit.toString(),
        gasPrice: txDetails.gasPrice ? ethersService.formatUnits(txDetails.gasPrice, 'gwei') + ' gwei' : 'Not available',
        maxFeePerGas: txDetails.maxFeePerGas ? ethersService.formatUnits(txDetails.maxFeePerGas, 'gwei') + ' gwei' : 'Not applicable',
        maxPriorityFeePerGas: txDetails.maxPriorityFeePerGas ? ethersService.formatUnits(txDetails.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'Not applicable',
        nonce: txDetails.nonce,
        data: txDetails.data && txDetails.data.length > 66 
          ? `${txDetails.data.substring(0, 66)}... (${txDetails.data.length} bytes)` 
          : txDetails.data || '0x'
      };

      return {
        content: [
          {
            type: "text",
            text: `Transaction Details:
Hash: ${formattedTx.hash}
Block: ${formattedTx.blockNumber} (${formattedTx.blockHash})
From: ${formattedTx.from}
To: ${formattedTx.to}
Value: ${formattedTx.value} ETH
Gas Limit: ${formattedTx.gasLimit}
Gas Price: ${formattedTx.gasPrice}
Max Fee: ${formattedTx.maxFeePerGas}
Priority Fee: ${formattedTx.maxPriorityFeePerGas}
Nonce: ${formattedTx.nonce}
Data: ${formattedTx.data}`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting transaction details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  },

  formatEther: async (args: unknown) => {
    const schema = z.object({
      wei: z.string()
    });

    try {
      const { wei } = schema.parse(args);
      const etherValue = ethersService.formatEther(wei);

      return {
        content: [
          {
            type: "text",
            text: `${wei} wei = ${etherValue} ETH`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error formatting wei to ether: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },
  
  parseEther: async (args: unknown) => {
    const schema = z.object({
      ether: z.string()
    });

    try {
      const { ether } = schema.parse(args);
      const weiValue = ethersService.parseEther(ether);

      return {
        content: [
          {
            type: "text",
            text: `${ether} ETH = ${weiValue.toString()} wei`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error parsing ether to wei: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },
  
  formatUnits: async (args: unknown) => {
    const schema = z.object({
      value: z.string(),
      unit: z.union([z.string(), z.number()])
    });

    try {
      const { value, unit } = schema.parse(args);
      const formattedValue = ethersService.formatUnits(value, unit);
      
      const unitName = typeof unit === 'string' ? unit : `${unit} decimals`;

      return {
        content: [
          {
            type: "text",
            text: `${value} = ${formattedValue} ${unitName}`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error formatting units: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },
  
  getContractCode: async (args: unknown) => {
    const schema = z.object({
      address: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional()
    });

    try {
      const { address, provider, chainId } = schema.parse(args);
      const bytecode = await ethersService.getContractCode(address, provider, chainId);

      if (!bytecode || bytecode === '0x') {
        return {
          content: [
            {
              type: "text",
              text: `No bytecode found for address ${address}. This is likely not a contract or the contract might have been self-destructed.`
            },
          ],
        };
      }

      // Truncate bytecode if it's too long
      let displayBytecode = bytecode;
      if (bytecode.length > 500) {
        displayBytecode = `${bytecode.substring(0, 500)}... (${bytecode.length} bytes total)`;
      }

      return {
        content: [
          {
            type: "text",
            text: `Contract bytecode for ${address}:\n\n${displayBytecode}`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving contract bytecode: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },
  
  contractCall: async (args: unknown) => {
    const schema = z.object({
      contractAddress: z.string(),
      abi: z.string(),
      method: z.string(),
      args: z.array(z.any()).optional().default([]),
      provider: z.string().optional(),
      chainId: z.number().optional()
    });

    try {
      const parsedArgs = schema.parse(args);
      const { contractAddress, abi, method, provider, chainId } = parsedArgs;
      const methodArgs = parsedArgs.args || [];
      
      // Call the contract method
      const result = await ethersService.contractCall(
        contractAddress,
        abi,
        method,
        methodArgs,
        provider,
        chainId
      );
      
      // Format the result for display
      let formattedResult;
      
      if (result === null || result === undefined) {
        formattedResult = "null";
      } else if (typeof result === 'object') {
        // Check if result is a BigInt
        if (typeof result === 'bigint') {
          formattedResult = result.toString();
        } else {
          try {
            formattedResult = JSON.stringify(result, (_, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2);
          } catch (e) {
            formattedResult = `[Complex object that could not be stringified: ${typeof result}]`;
          }
        }
      } else {
        formattedResult = String(result);
      }

      return {
        content: [
          {
            type: "text",
            text: `Contract call to ${contractAddress}:
Method: ${method}
Arguments: ${JSON.stringify(methodArgs)}
Result: ${formattedResult}`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error calling contract method: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },

  // ERC20 Token Tools
  erc20_balanceOf: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: z.string(),
      ownerAddress: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional()
    });

    try {
      const { tokenAddress, ownerAddress, provider, chainId } = schema.parse(args);
      
      // Import the ERC20 service functions dynamically
      const { getBalance, getTokenInfo } = await import('./services/erc/erc20.js');
      
      // Get the balance and token info
      const balance = await getBalance(ethersService, tokenAddress, ownerAddress, provider, chainId);
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      return {
        content: [
          {
            type: "text",
            text: `Balance: ${balance} ${tokenInfo.symbol}\nAddress: ${ownerAddress}\nToken: ${tokenInfo.name} (${tokenInfo.symbol})`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting ERC20 token balance: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  },
  
  erc20_getTokenInfo: async (args: unknown) => {
    const schema = z.object({
      tokenAddress: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional()
    });

    try {
      const { tokenAddress, provider, chainId } = schema.parse(args);
      
      // Import the ERC20 service function dynamically
      const { getTokenInfo } = await import('./services/erc/erc20.js');
      
      // Get the token info
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Format total supply with proper decimal places
      const formattedTotalSupply = ethers.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals);
      
      return {
        content: [
          {
            type: "text",
            text: `Token Information:
Name: ${tokenInfo.name}
Symbol: ${tokenInfo.symbol}
Decimals: ${tokenInfo.decimals}
Total Supply: ${formattedTotalSupply} ${tokenInfo.symbol}
Contract Address: ${tokenAddress}`
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error getting ERC20 token information: ${
              error instanceof Error ? error.message : String(error)
            }`
          },
        ],
      };
    }
  }
};

// Combine all handlers
const toolHandlers = {
  ...existingHandlers,
  ...allHandlers,
};

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = toolHandlers[name as keyof typeof toolHandlers];
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await handler(args);
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error processing the request: ${error.message}`,
        },
      ],
    };
  }
});

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(
    `MCP server running on stdio (default network: ${defaultNetwork})`
  );
}
