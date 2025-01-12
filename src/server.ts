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

config(); // Load environment variables

// Define schemas for contract calls
const contractCallSchema = z.object({
    contractAddress: z.string(),
    abi: z.union([z.string(), z.array(z.string())]),
    method: z.string(),
    methodArgs: z.array(z.any()).optional(),
    provider: z.string().optional(),
    chainId: z.number().optional()
});

const contractCallViewSchema = z.object({
    address: z.string(),
    abi: z.union([z.string(), z.array(z.string())]),
    method: z.string(),
    args: z.array(z.any()).optional(),
    provider: z.string().optional(),
    chainId: z.number().optional()
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
const defaultNetwork = (process.env.DEFAULT_NETWORK || "mainnet") as DefaultProvider;
const provider = new ethers.AlchemyProvider(defaultNetwork, process.env.ALCHEMY_API_KEY);
const ethersService = new EthersService(provider);

// Tool definitions
const tools = [
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "getERC20Balance",
        description: "Get the ERC20 token balance of a wallet",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "The Ethereum address to query",
                },
                tokenAddress: {
                    type: "string",
                    description: "The address of the ERC20 token contract"
                },
                provider: {
                    type: "string",
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["address", "tokenAddress"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["address"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["blockTag"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["txHash"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["address"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["address"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                },
            },
            required: ["name"]
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
            required: ["wei"]
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
            required: ["ether"]
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
            required: ["value", "unit"]
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
            required: ["value", "unit"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["to", "value"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["message"]
        },
    },
    {
        name: "contractCall",
        description: "Call a view/pure method on a smart contract (read-only operations)",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use for the call. If provided, will verify it matches the provider's network.",
                }
            },
            required: ["contractAddress", "abi", "method"]
        },
    },
    {
        name: "contractCallView",
        description: "Call a view/pure method on a smart contract (read-only operations)",
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
                    description: "The name of the method to call (must be a view/pure function)",
                },
                args: {
                    type: "array",
                    description: "The arguments to pass to the method",
                    items: { type: "any" },
                },
                provider: {
                    type: "string",
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use for the call. If provided, will verify it matches the provider's network.",
                }
            },
            required: ["contractAddress", "abi", "method"]
        },
    },
    {
        name: "contractCallWithEstimate",
        description: "Call a method on a smart contract with automatic gas estimation",
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
                        type: ["string", "number", "boolean", "object"]
                    }
                },
                value: {
                    type: "string",
                    description: "Optional. The amount of ETH to send with the call",
                },
                provider: {
                    type: "string",
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi", "method"]
        },
    },
    {
        name: "contractSendTransaction",
        description: "Call a method on a smart contract and send a transaction with custom parameters",
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
                        type: ["string", "number", "boolean", "object"]
                    }
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi", "method"]
        },
    },
    {
        name: "contractSendTransactionWithEstimate",
        description: "Call a method on a smart contract and send a transaction with automatic gas estimation",
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
                        type: ["string", "number", "boolean", "object"]
                    }
                },
                value: {
                    type: "string",
                    description: "Optional. The amount of ETH to send with the call",
                },
                provider: {
                    type: "string",
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi", "method"]
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
                        type: ["string", "number", "boolean", "object"]
                    }
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi", "method"]
        },
    },
    {
        name: "contractSendTransactionWithOverrides",
        description: "Call a method on a smart contract and send a transaction with custom parameters",
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
                        type: ["string", "number", "boolean", "object"]
                    }
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi", "method"]
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                }
            },
            required: ["signedTransaction"]
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
                    description: "A list of topics to filter by. Each item can be a string, null, or an array of strings (optional)",
                    items: { 
                        type: ["string", "null", "array"],
                        items: { type: "string" }
                    }
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
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
                    description: "A list of topics to filter by. Each item can be a string, null, or an array of strings (optional)",
                    items: { 
                        type: ["string", "null", "array"],
                        items: { type: "string" }
                    }
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
            },
            required: ["contractAddress", "abi"]
        },
    },
    {
        name: "sendTransactionWithOptions",
        description: "Send a transaction with advanced options including gas limit, gas price, and nonce",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use for the transaction. If provided, will verify it matches the provider's network.",
                }
            },
            required: ["to", "value"]
        },
    },
    {
        name: "getSupportedNetworks",
        description: "Get a list of all supported networks and their configurations. Call this first to discover available networks before using other network-related functions.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});

// Tool handlers
const toolHandlers = {
    getWalletBalance: async (args: unknown) => {
        const schema = z.object({ 
            address: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { address, provider, chainId } = schema.parse(args);
        const balance = await ethersService.getBalance(address, provider, chainId);
        return {
            content: [{ type: "text", text: `The balance of ${address} is ${balance} ETH` }],
        };
    },
    
    getERC20Balance: async (args: unknown) => {
        const schema = z.object({
            address: z.string(),
            tokenAddress: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { address, tokenAddress, provider, chainId } = schema.parse(args);
        const balance = await ethersService.getERC20Balance(address, tokenAddress, provider, chainId);
        return {
            content: [{ type: "text", text: `The ERC20 balance of ${address} is ${balance}` }],
        };
    },
    
    getWalletTransactionCount: async (args: unknown) => {
        const schema = z.object({ 
            address: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { address, provider, chainId } = schema.parse(args);
        const count = await ethersService.getTransactionCount(address, provider, chainId);
        return {
            content: [{ type: "text", text: `The transaction count for ${address} is ${count}` }],
        };
    },

    getBlockNumber: async (args: unknown) => {
        const schema = z.object({ 
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { provider, chainId } = schema.parse(args);
        const blockNumber = await ethersService.getBlockNumber(provider, chainId);
        return {
            content: [{ type: "text", text: `The current block number is ${blockNumber}` }],
        };
    },

    getBlockDetails: async (args: unknown) => {
        const schema = z.object({
            blockTag: z.union([z.string(), z.number()]),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { blockTag, provider, chainId } = schema.parse(args);
        const blockDetails = await ethersService.getBlockDetails(blockTag, provider, chainId);
        
        if (blockDetails === null) {
            return {
                isError: true,
                content: [{ type: "text", text: `Block not found for tag: ${blockTag}` }]
            };
        }

        return {
            content: [{ type: "text", text: JSON.stringify(blockDetails, null, 2) }],
        };
    },

    getTransactionDetails: async (args: unknown) => {
        const schema = z.object({
            txHash: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { txHash, provider, chainId } = schema.parse(args);
        const txDetails = await ethersService.getTransactionDetails(txHash, provider, chainId);
        
        if (txDetails === null) {
            return {
                isError: true,
                content: [{ type: "text", text: `Transaction not found: ${txHash}` }]
            };
        }

        return {
            content: [{ type: "text", text: JSON.stringify(txDetails, null, 2) }],
        };
    },

    getGasPrice: async (args: unknown) => {
        const schema = z.object({ 
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { provider, chainId } = schema.parse(args);
        const gasPrice = await ethersService.getGasPrice(provider, chainId);
        return {
            content: [{ type: "text", text: `The current gas price is ${gasPrice} gwei` }],
        };
    },

    getFeeData: async (args: unknown) => {
        const schema = z.object({ 
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { provider, chainId } = schema.parse(args);
        const feeData = await ethersService.getFeeData(provider, chainId);
        return {
            content: [{ type: "text", text: JSON.stringify(feeData, null, 2) }],
        };
    },

    getContractCode: async (args: unknown) => {
        const schema = z.object({
            address: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { address, provider, chainId } = schema.parse(args);
        const code = await ethersService.getContractCode(address, provider, chainId);
        
        if (code === null || code === "0x") {
            return {
                isError: true,
                content: [{ type: "text", text: `No code found at address: ${address}` }]
            };
        }

        return {
            content: [{ type: "text", text: `Contract bytecode at ${address}:\n\n${code}` }],
        };
    },

    lookupAddress: async (args: unknown) => {
        const schema = z.object({
            address: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { address, provider, chainId } = schema.parse(args);
        const ensName = await ethersService.lookupAddress(address, provider, chainId);
        
        if (ensName === null) {
            return {
                content: [{ type: "text", text: `No ENS name found for address: ${address}` }]
            };
        }

        return {
            content: [{ type: "text", text: `The ENS name for ${address} is ${ensName}` }],
        };
    },

    resolveName: async (args: unknown) => {
        const schema = z.object({
            name: z.string(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { name, provider, chainId } = schema.parse(args);
        const address = await ethersService.resolveName(name, provider, chainId);
        
        if (address === null) {
            return {
                content: [{ type: "text", text: `No address found for ENS name: ${name}` }]
            };
        }

        return {
            content: [{ type: "text", text: `The address for ${name} is ${address}` }],
        };
    },

    formatEther: async (args: unknown) => {
        const schema = z.object({
            wei: z.string()
        });
        const { wei } = schema.parse(args);
        const formatted = ethersService.formatEther(wei);
        return {
            content: [{ type: "text", text: `${wei} wei = ${formatted} ETH` }],
        };
    },

    parseEther: async (args: unknown) => {
        const schema = z.object({
            ether: z.string()
        });
        const { ether } = schema.parse(args);
        const parsed = ethersService.parseEther(ether);
        return {
            content: [{ type: "text", text: `${ether} ETH = ${parsed} wei` }],
        };
    },

    formatUnits: async (args: unknown) => {
        const schema = z.object({
            value: z.string(),
            unit: z.union([z.string(), z.number()])
        });
        const { value, unit } = schema.parse(args);
        const formatted = ethersService.formatUnits(value, unit);
        return {
            content: [{ type: "text", text: `${value} = ${formatted} (with ${unit} decimals)` }],
        };
    },

    parseUnits: async (args: unknown) => {
        const schema = z.object({
            value: z.string(),
            unit: z.union([z.string(), z.number()])
        });
        const { value, unit } = schema.parse(args);
        const parsed = ethersService.parseUnits(value, unit);
        return {
            content: [{ type: "text", text: `${value} = ${parsed} (with ${unit} decimals)` }],
        };
    },

    sendTransaction: async (args: unknown) => {
        const schema = z.object({
            to: z.string(),
            value: z.string(),
            data: z.string().optional(),
            provider: z.string().optional()
        });
        const { to, value, data, provider } = schema.parse(args);
        try {
            const tx = await ethersService.sendTransaction(to, value, data, provider);
            return {
                content: [{
                    type: "text",
                    text: `Transaction sent with hash ${tx.hash}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Transaction failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    signMessage: async (args: unknown) => {
        const schema = z.object({
            message: z.string(),
            provider: z.string().optional()
        });
        const { message, provider } = schema.parse(args);
        try {
            const signature = await ethersService.signMessage(message, provider);
            return {
                content: [{
                    type: "text",
                    text: `Signature: ${signature}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Message signing failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractCall: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], provider, chainId } = schema.parse(args);
        try {
            const result = await ethersService.contractCall(contractAddress, abi, method, methodArgs, provider, chainId);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract call failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractCallWithEstimate: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            value: z.string().optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], value = "0", provider } = schema.parse(args);
        try {
            const result = await ethersService.contractCallWithEstimate(contractAddress, abi, method, methodArgs, value, provider);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract call with estimate failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractSendTransaction: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            value: z.string().optional(),
            gasLimit: z.string().optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], value = "0", gasLimit, provider } = schema.parse(args);
        try {
            const overrides = gasLimit ? { gasLimit: ethers.getBigInt(gasLimit) } : undefined;
            const result = await ethersService.contractSendTransaction(
                contractAddress,
                abi,
                method,
                methodArgs,
                value,
                provider,
                overrides
            );
            return {
                content: [{
                    type: "text",
                    text: `Transaction sent with hash ${result.hash}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract send transaction failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractSendTransactionWithEstimate: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            value: z.string().optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], value = "0", provider } = schema.parse(args);
        try {
            const result = await ethersService.contractSendTransactionWithEstimate(
                contractAddress,
                abi,
                method,
                methodArgs,
                value,
                provider
            );
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract send transaction with estimate failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    sendRawTransaction: async (args: unknown) => {
        const schema = z.object({
            signedTransaction: z.string(),
            provider: z.string().optional()
        });
        const { signedTransaction, provider } = schema.parse(args);
        try {
            const tx = await ethersService.sendRawTransaction(signedTransaction, provider);
            return {
                content: [{
                    type: "text",
                    text: `Transaction sent with hash ${tx.hash}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Send raw transaction failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractCallWithOverrides: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            value: z.string().optional(),
            gasLimit: z.string().optional(),
            gasPrice: z.string().optional(),
            nonce: z.number().optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], value = "0", gasLimit, gasPrice, nonce, provider } = schema.parse(args);
        try {
            const overrides: ethers.Overrides = {};
            if (gasLimit) overrides.gasLimit = ethers.getBigInt(gasLimit);
            if (gasPrice) overrides.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
            if (nonce !== undefined) overrides.nonce = nonce;

            const result = await ethersService.contractCallWithOverrides(
                contractAddress,
                abi,
                method,
                methodArgs,
                value,
                provider,
                overrides
            );
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract call with overrides failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractSendTransactionWithOverrides: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            value: z.string().optional(),
            gasLimit: z.string().optional(),
            gasPrice: z.string().optional(),
            nonce: z.number().optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], value = "0", gasLimit, gasPrice, nonce, provider } = schema.parse(args);
        try {
            const overrides: ethers.Overrides = {};
            if (gasLimit) overrides.gasLimit = ethers.getBigInt(gasLimit);
            if (gasPrice) overrides.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
            if (nonce !== undefined) overrides.nonce = nonce;

            const result = await ethersService.contractSendTransactionWithOverrides(
                contractAddress,
                abi,
                method,
                methodArgs,
                value,
                provider,
                overrides
            );
            return {
                content: [{
                    type: "text",
                    text: `Transaction sent with hash ${result.hash}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract send transaction with overrides failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    queryLogs: async (args: unknown) => {
        const schema = z.object({
            address: z.string().optional(),
            topics: z.array(z.union([z.string(), z.null(), z.array(z.string())])).optional(),
            fromBlock: z.union([z.string(), z.number()]).optional(),
            toBlock: z.union([z.string(), z.number()]).optional(),
            provider: z.string().optional()
        });
        const { address, topics, fromBlock, toBlock, provider } = schema.parse(args);
        try {
            const logs = await ethersService.queryLogs(address, topics, fromBlock, toBlock, provider);
            return { content: [{ type: "text", text: JSON.stringify(logs, null, 2) }] };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Query logs failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractEvents: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            eventName: z.string().optional(),
            topics: z.array(z.union([z.string(), z.null(), z.array(z.string())])).optional(),
            fromBlock: z.union([z.string(), z.number()]).optional(),
            toBlock: z.union([z.string(), z.number()]).optional(),
            provider: z.string().optional()
        });
        const { contractAddress, abi, eventName, topics, fromBlock, toBlock, provider } = schema.parse(args);

        try {
            const events = await ethersService.contractEvents(
                contractAddress,
                abi,
                eventName,
                topics,
                fromBlock,
                toBlock,
                provider
            );
            return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Query events failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    sendTransactionWithOptions: async (args: unknown) => {
        const schema = z.object({
            to: z.string(),
            value: z.string(),
            data: z.string().optional(),
            gasLimit: z.string().optional(),
            gasPrice: z.string().optional(),
            nonce: z.number().optional(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { to, value, data, gasLimit, gasPrice, nonce, provider, chainId } = schema.parse(args);
        try {
            const tx = await ethersService.sendTransactionWithOptions(to, value, data, gasLimit, gasPrice, nonce, provider, chainId);
            return {
                content: [{
                    type: "text",
                    text: `Transaction sent with hash ${tx.hash}`
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Send transaction with options failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    contractCallView: async (args: unknown) => {
        const schema = z.object({
            contractAddress: z.string(),
            abi: z.string(),
            method: z.string(),
            methodArgs: z.array(z.any()).optional(),
            provider: z.string().optional(),
            chainId: z.number().optional()
        });
        const { contractAddress, abi, method, methodArgs = [], provider, chainId } = schema.parse(args);
        try {
            const result = await ethersService.contractCallView(contractAddress, abi, method, methodArgs, provider, chainId);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Contract view call failed: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },

    getSupportedNetworks: async () => {
        try {
            const networks = await ethersService.getSupportedNetworks();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(networks, null, 2)
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ type: "text", text: `Failed to get supported networks: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    },
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
            content: [{ type: "text", text: `Error processing the request: ${error.message}` }]
        };
    }
});

export async function startServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`MCP server running on stdio (default network: ${defaultNetwork})`);
} 