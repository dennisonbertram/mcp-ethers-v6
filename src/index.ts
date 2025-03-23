#!/usr/bin/env node
import { config } from 'dotenv';
import { logger } from './utils/logger.js';

// Load environment variables
config();

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = new Map();

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (value !== undefined) {
      argMap.set(key, value);
    } else {
      argMap.set(key, true);
    }
  }
});

// Set environment variables from command line arguments
if (argMap.has('network')) {
  process.env.DEFAULT_NETWORK = argMap.get('network');
}

if (argMap.has('help')) {
  logger.info(`
MCP Ethers Wallet Server

Usage:
  npm start -- [options]

Options:
  --network=<network>  Specify the default network (e.g., mainnet, goerli)
  --help               Show this help message
  `);
  process.exit(0);
}

// Import and run the MCP server
import './mcpServer.js'; 