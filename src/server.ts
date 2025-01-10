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