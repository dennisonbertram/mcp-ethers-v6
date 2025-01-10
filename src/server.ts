import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { EthersService, DefaultProvider } from "./services/ethersService.js";
import { z } from "zod";
import { config } from "dotenv";

config(); // Load environment variables

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
const ethersService = new EthersService(defaultNetwork);

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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
                    description: "Optional. Either a supported network name (mainnet, sepolia, goerli, arbitrum, optimism, base, polygon) or a custom RPC URL. Defaults to mainnet if not provided.",
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
            provider: z.string().optional()
        });
        const { address, provider } = schema.parse(args);
        const balance = await ethersService.getBalance(address, provider);
        
        return {
            content: [
                {
                    type: "text",
                    text: `The balance of ${address} is ${balance} ETH`,
                },
            ],
        };
    },
    
    getERC20Balance: async (args: unknown) => {
        const schema = z.object({ 
            address: z.string(), 
            tokenAddress: z.string(),
            provider: z.string().optional()
        });
        const { address, tokenAddress, provider } = schema.parse(args);
        const balance = await ethersService.getERC20Balance(address, tokenAddress, provider);
        return {
            content: [
                {
                    type: "text",
                    text: `The balance of ${address} is ${balance} in ${tokenAddress}`
                },
            ],
        };
    },
    
    getWalletTransactionCount: async (args: unknown) => {
        const schema = z.object({ 
            address: z.string(),
            provider: z.string().optional()
        });
        const { address, provider } = schema.parse(args);
        const count = await ethersService.getTransactionCount(address, provider);
        return {
            content: [{ type: "text", text: `The transaction count for ${address} is ${count}` }],
        };
    },

    getBlockNumber: async (args: unknown) => {
        const schema = z.object({ provider: z.string().optional() });
        const { provider } = schema.parse(args);
        const blockNumber = await ethersService.getBlockNumber(provider);
        return {
            content: [{ type: "text", text: `The current block number is ${blockNumber}` }],
        };
    },

    getBlockDetails: async (args: unknown) => {
        const schema = z.object({
            blockTag: z.union([z.string(), z.number()]),
            provider: z.string().optional()
        });
        const { blockTag, provider } = schema.parse(args);
        const blockDetails = await ethersService.getBlockDetails(blockTag, provider);
        
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
            provider: z.string().optional()
        });
        const { txHash, provider } = schema.parse(args);
        const txDetails = await ethersService.getTransactionDetails(txHash, provider);
        
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
        const schema = z.object({ provider: z.string().optional() });
        const { provider } = schema.parse(args);
        const gasPrice = await ethersService.getGasPrice(provider);
        return {
            content: [{ type: "text", text: `The current gas price is ${gasPrice} gwei` }],
        };
    },

    getFeeData: async (args: unknown) => {
        const schema = z.object({ provider: z.string().optional() });
        const { provider } = schema.parse(args);
        const feeData = await ethersService.getFeeData(provider);
        return {
            content: [{ type: "text", text: JSON.stringify(feeData, null, 2) }],
        };
    },

    getContractCode: async (args: unknown) => {
        const schema = z.object({
            address: z.string(),
            provider: z.string().optional()
        });
        const { address, provider } = schema.parse(args);
        const code = await ethersService.getContractCode(address, provider);
        
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
            provider: z.string().optional()
        });
        const { address, provider } = schema.parse(args);
        const ensName = await ethersService.lookupAddress(address, provider);
        
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
            provider: z.string().optional()
        });
        const { name, provider } = schema.parse(args);
        const address = await ethersService.resolveName(name, provider);
        
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