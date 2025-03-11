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

// Import the new tool definitions and handlers
import { allTools, allHandlers } from "./tools/index.js";
import { initializeErc20Handlers } from "./tools/handlers/erc20.js";
import { initializeErc721Handlers } from "./tools/handlers/erc721.js";
import { initializeErc1155Handlers } from "./tools/handlers/erc1155.js";

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

// Initialize handlers with ethersService
initializeErc20Handlers(ethersService);
initializeErc721Handlers(ethersService);
initializeErc1155Handlers(ethersService);

// Define existing tools
const existingTools = [
    {
        name: "getSupportedNetworks",
        description: "Get a list of all supported networks and their configurations. Shows which network is the default (used when no provider is specified). Call this first to discover available networks before using other network-related functions.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "checkWalletExists",
        description: "Check if there is a wallet configured on the server. Returns basic wallet info like address but never exposes private keys.",
        inputSchema: {
            type: "object",
            properties: {
                provider: {
                    type: "string",
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks. If not provided, uses the default network.",
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
                    description: "Optional. Either a network name or custom RPC URL. Use getSupportedNetworks to get a list of supported networks.",
                },
                chainId: {
                    type: "number",
                    description: "Optional. The chain ID to use. If provided with a named network and they don't match, the RPC's chain ID will be used.",
                }
            },
            required: ["blockTag"]
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
            chainId: z.number().optional()
        });
        const { address, provider, chainId } = schema.parse(args);
        const balance = await ethersService.getBalance(address, provider, chainId);
        return {
            content: [{ type: "text", text: `The balance of ${address} is ${balance} ETH` }],
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
    
    getSupportedNetworks: async (args: unknown) => {
        const networks = ethersService.getSupportedNetworks();
        return {
            content: [{ type: "text", text: JSON.stringify(networks, null, 2) }],
        };
    },
    
    checkWalletExists: async (args: unknown) => {
        const schema = z.object({
            provider: z.string().optional()
        });
        const { provider } = schema.parse(args);
        
        try {
            const walletInfo = await ethersService.getWalletInfo(provider);
            if (!walletInfo) {
                return {
                    content: [{ 
                        type: "text", 
                        text: "No wallet is currently configured on the server." 
                    }]
                };
            }
            
            return {
                content: [{ 
                    type: "text", 
                    text: `Wallet is configured with address: ${walletInfo.address}` 
                }]
            };
        } catch (error) {
            return {
                isError: true,
                content: [{ 
                    type: "text", 
                    text: `Error checking wallet: ${error instanceof Error ? error.message : String(error)}` 
                }]
            };
        }
    },
};

// Combine all handlers
const toolHandlers = {
    ...existingHandlers,
    ...allHandlers
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