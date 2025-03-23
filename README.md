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
- `generateWallet`: Generate a new Ethereum wallet with a random private key
- `loadWallet`: Load an existing wallet from a private key for the current session
- `checkWalletExists`: Check if a wallet is configured (without exposing private keys)
- `getWalletBalance`: Get the native token balance of a wallet
- `getWalletTransactionCount`: Get the number of transactions sent from a wallet
- `getERC20Balance`: Get the balance of an ERC20 token for a wallet

### Transaction Management
- `getTransactionDetails`: Get detailed information about a transaction
- `sendTransaction`: Send a native token transaction
- `sendTransactionWithOptions`: Send a transaction with custom options (gas, nonce, etc)
- `getTransactionsByBlock`: Get all transactions in a specific block

### Signing Operations
- `signMessage`: Sign a message using personal_sign (the recommended method)
- `ethSign`: Sign data using the legacy eth_sign method (use with caution)

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

### Wallet Setup

There are three ways to set up a wallet for transaction signing:

1. **Environment Variable**: Add your private key to the `.env` file:
   ```
   PRIVATE_KEY=0x123abc...
   ```

2. **Generate a New Wallet**: Use the `generateWallet` tool to create a new wallet:
   ```
   <invoke name="generateWallet">
   <parameter name="saveToEnv">true</parameter>
   </invoke>
   ```
   This will generate a new random wallet and optionally save it to the server's environment for the current session.

3. **Load an Existing Wallet**: Use the `loadWallet` tool to load a wallet from an existing private key:
   ```
   <invoke name="loadWallet">
   <parameter name="privateKey">0x123abc...</parameter>
   </invoke>
   ```
   This will load the wallet and make it available for transactions in the current session.

**Important**: Always keep your private keys secure. Never share them or commit them to version control.

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

# Run tests with Jest
npm test

# Run tests with Bun (faster)
npm run test:bun:all

# Start in development mode
npm run dev

# Build
npm run build
```

## Testing

### Unit and Integration Tests

The project includes comprehensive test suites that can be run with either Jest or Bun:

```bash
# Run all tests with Jest
npm test

# Run all tests with Bun (recommended)
npm run test:bun:all

# Run specific test suites with Bun
npm run test:bun:erc20    # Only ERC20 tests
npm run test:bun:erc721   # Only ERC721 tests
npm run test:bun:erc1155  # Only ERC1155 tests
npm run test:bun:methods  # Only contract and write method tests
```

The tests use a real Hardhat blockchain node instead of mocks, providing more reliable and accurate testing.

### Testing MCP Integration

The project includes a comprehensive testing framework for verifying the MCP server functionality:

```bash
# Run all MCP tests
npm run test:mcp

# Run specific test suites
npm run test:mcp:core     # Test core tools
npm run test:mcp:erc20    # Test ERC20 token tools
npm run test:mcp:nft      # Test NFT tools
npm run test:mcp:basic    # Run basic functionality tests

# Run a complete test with detailed reporting
npm run test:mcp:report

# Validate your Alchemy API key
npm run validate:alchemy
```

The testing framework:
- Verifies server initialization
- Tests tool discovery and listing
- Validates individual tool functionality
- Generates detailed reports of test results
- Catches API key and authentication issues

### Test Reports

Tests generate a Markdown report with:
- Test status (pass/fail)
- Duration of each test 
- Error details for failed tests
- Overall success rate

### Alchemy API Setup

For the Ethers server to function correctly, you need a valid Alchemy API key:

1. Create a free account at [Alchemy](https://www.alchemy.com/)
2. Create a new app and get your API key
3. Add it to your `.env` file: `ALCHEMY_API_KEY=your_key_here`

For detailed instructions, see [ALCHEMY_SETUP.md](ALCHEMY_SETUP.md).

## Tool Status

Based on comprehensive testing, the following tool categories are available:

### Core Tools
- Network information (getSupportedNetworks)
- Wallet generation and management
- Block and transaction utilities

### ERC20 Token Tools
- Token information (name, symbol, decimals, supply)
- Balance checking
- Allowance management
- Transfer and approval operations

### NFT Tools
- Collection information
- Ownership verification
- Metadata retrieval
- Transfer operations

## Contributing

Issues and pull requests are welcome on GitHub.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Dennison Bertram (dennison@tally.xyz)

## What's New in v1.1.7

### Improvements
- **Enhanced Error Handling**: Improved error detection and reporting for invalid ERC20 contracts
  - Better error messages when contracts return empty data
  - More detailed error logging for debugging
  - Added specific error codes in error messages
- **Fixed Parameter Order**: Corrected parameter order in `getERC20Balance` tool for consistent behavior
- **Improved Testing**: Added new test cases
  - Test for valid tokens with zero balance
  - Test for invalid ERC20 contracts
  - Verification of parameter order correctness

### Breaking Changes
None. All changes are backward compatible.

### Usage
To get an ERC20 token balance:
```typescript
const balance = await ethersService.getERC20Balance(
  ownerAddress,    // The address to check balance for
  tokenAddress,    // The ERC20 token contract address
  provider,        // Optional: provider name or instance
  chainId         // Optional: chain ID
);
```

If the contract is not a valid ERC20 token, you'll now get a more descriptive error:
```typescript
Error: Contract at 0x... does not appear to be a valid ERC20 token. It returned empty data for the balanceOf call. Error code: BAD_DATA
```

## Testing

### Standard Test Client

The MCP Ethers Wallet server includes a standardized test client based on the official MCP TypeScript SDK. This client can be used to run automated tests against the server.

#### Running Tests

To run all tests:

```bash
npm run test:client
```

To run specific test suites:

```bash
# Run basic connectivity tests
npm run test:client:basic

# Run wallet functionality tests
npm run test:client:wallet
```

#### Test Reports

The test client generates detailed reports in multiple formats:

- Console output
- HTML report (in `reports/mcp-test-report.html`)
- JSON report (in `reports/mcp-test-report.json`)

#### Creating Custom Tests

You can extend the test client with your own test suites by:

1. Creating a new test suite file in `src/tests/client/suites/`
2. Updating `src/tests/runTests.ts` to include your test suite
3. Adding a new npm script to package.json if needed

#### Test Client Architecture

The test client is built using a modular architecture:

- `McpStandardClient`: Main client class using the official MCP SDK
- Test suites: Collections of related tests
- Test utilities: Assertions, test running, and reporting
- Test runner: Command-line interface to run tests 