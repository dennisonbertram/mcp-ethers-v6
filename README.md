# MCP Ethers Wallet ![NPM Version](https://img.shields.io/npm/v/mcp-ethers-wallet)

A Model Context Protocol server for interacting with Ethereum wallets and networks using Ethers.js v6. This server provides LLMs with a standardized interface to interact with Ethereum networks, smart contracts, and wallets.

## Overview

The MCP Ethers Wallet server implements the [Model Context Protocol](https://modelcontextprotocol.io) specification, providing LLMs with tools to:

- Query blockchain data across multiple networks
- Interact with smart contracts
- Manage wallet operations
- Resolve ENS names
- Handle transactions
- Estimate gas costs
- Work with ERC20, ERC721, and ERC1155 tokens

## Installation

```bash
npm install mcp-ethers-wallet
```

## Quick Start

### Starting the Server

```typescript
import { startServer } from 'mcp-ethers-wallet';

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Using with Claude Desktop

1. Install Claude Desktop
2. Add a new MCP server with the following configuration:
   ```json
    "ethers": {
      "command": "node",
      "args": [
        "/path-to-mcp-ethers-wallet/build/src/index.js"
      ],
      "env": {
        "ALCHEMY_API_KEY": "<<your alchemy api key>>"
      }
    }
   ```
3. The tools will now be available in your Claude conversations

### Testing with MCP Inspector

1. Install the MCP Inspector:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. In another terminal, run the inspector:
   ```bash
   mcp-inspector
   ```

4. Open http://localhost:5173 in your browser to interact with the tools

## Available Tools

### Network Information
- `getSupportedNetworks`: Get a list of all supported networks and their configurations
- `getBlockNumber`: Get the current block number for a network
- `getBlockDetails`: Get detailed information about a specific block
- `getGasPrice`: Get the current gas price
- `getFeeData`: Get detailed fee data including base fee and priority fee

### Wallet Operations
- `checkWalletExists`: Check if a wallet is configured (without exposing private keys)
- `getWalletBalance`: Get the native token balance of a wallet
- `getWalletTransactionCount`: Get the number of transactions sent from a wallet
- `getERC20Balance`: Get the balance of an ERC20 token for a wallet

### Transaction Management
- `getTransactionDetails`: Get detailed information about a transaction
- `sendTransaction`: Send a native token transaction
- `sendTransactionWithOptions`: Send a transaction with custom options (gas, nonce, etc)
- `getTransactionsByBlock`: Get all transactions in a specific block

### Smart Contract Interaction
- `contractCall`: Execute a contract write method
- `contractCallView`: Execute a contract read method
- `getContractCode`: Get the bytecode of a deployed contract

### ENS Operations
- `lookupAddress`: Resolve an ENS name to an address
- `resolveName`: Resolve an address to an ENS name

### ERC20 Token Operations
- `getERC20TokenInfo`: Get basic information about an ERC20 token (name, symbol, decimals, total supply)
- `getERC20Balance`: Get the token balance for an address
- `getERC20Allowance`: Get the approved amount for a spender
- `transferERC20`: Transfer tokens to a recipient
- `approveERC20`: Approve a spender to use tokens
- `transferFromERC20`: Transfer tokens from one address to another (requires approval)

### ERC721 NFT Operations
- `getERC721CollectionInfo`: Get basic information about an NFT collection
- `getERC721Owner`: Get the owner of a specific NFT
- `getERC721Metadata`: Get and parse metadata for a specific NFT
- `getERC721TokensOfOwner`: Get all NFTs owned by an address
- `transferERC721`: Transfer an NFT to a new owner
- `safeTransferERC721`: Safely transfer an NFT to a new owner

### ERC1155 Multi-Token Operations
- `getERC1155Balance`: Get token balance for a specific token ID
- `getERC1155BatchBalances`: Get token balances for multiple token IDs at once
- `getERC1155Metadata`: Get and parse metadata for a specific token
- `getERC1155TokensOfOwner`: Get all tokens owned by an address
- `safeTransferERC1155`: Safely transfer tokens to another address
- `safeBatchTransferERC1155`: Safely transfer multiple tokens in a batch

## Network Support

The server supports multiple networks including:
- Ethereum Mainnet
- Polygon PoS
- Arbitrum
- Optimism
- Base
- And more...

Use the `getSupportedNetworks` tool to get a complete list of supported networks.

## Configuration

The server can be configured using environment variables:

- `ALCHEMY_API_KEY`: Your Alchemy API key for network access
- `PRIVATE_KEY`: Private key for transaction signing (optional)
- `DEFAULT_NETWORK`: Default network to use (defaults to "mainnet")
- `LOG_LEVEL`: Logging level (error, warn, info, debug) - defaults to "info"
- `SERVER_PORT`: Port to run the server on (defaults to 3000)

## Error Handling

The server provides detailed error messages for common issues:
- Invalid network names or RPC URLs
- Chain ID mismatches
- Contract interaction failures
- Transaction errors
- Network connectivity issues
- Token-specific errors (insufficient balance, allowance, etc.)

## Caching

The server implements intelligent caching for frequently accessed data:
- Token metadata (1 hour TTL)
- Token balances (30 seconds TTL)
- Block data (10 seconds TTL)
- Transaction data (1 minute TTL)

## Rate Limiting

To prevent abuse, the server implements rate limiting for various operations:
- General operations: 120 requests per minute
- Contract calls: 60 requests per minute
- Transactions: 20 requests per minute

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start in development mode
npm run dev

# Build
npm run build
```

## Contributing

Issues and pull requests are welcome on GitHub.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Dennison Bertram (dennison@tally.xyz) 