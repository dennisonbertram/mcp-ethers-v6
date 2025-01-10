import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { EthersService } from "./services/ethersService.js";
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

// Initialize the ethers service
const ethersService = new EthersService();

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
                        }
                    },
                    required: ["address", "tokenAddress"]
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "getWalletBalance") {
            const addressSchema = z.object({ address: z.string() });
            const { address } = addressSchema.parse(args);
            const balance = await ethersService.getBalance(address);
            
            return {
                content: [
                    {
                        type: "text",
                        text: `The balance of ${address} is ${balance} ETH`,
                    },
                ],
            };
        } else if (name === "getERC20Balance") {
            const erc20Schema = z.object({ address: z.string(), tokenAddress: z.string() });
            const { address, tokenAddress } = erc20Schema.parse(args);
            const balance = await ethersService.getERC20Balance(address, tokenAddress);
            return {
                content: [
                    {
                        type: "text",
                        text: `The balance of ${address} is ${balance} in ${tokenAddress}`
                    },
                ],
            };
        }
    } catch (error: any) {
        return {
            isError: true,
            content: [{ type: "text", text: `Error processing the request: ${error.message}` }]
        };
    }
    throw new Error("Tool not found");
});

export async function startServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server running on stdio");
} 