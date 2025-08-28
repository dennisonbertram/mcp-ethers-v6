# MCP Ethers Server

**⚡ Claude Code Setup:**
```bash
claude mcp add ethers-wallet -- node /path/to/ethers-server/build/src/index.js
```

A complete [ethers.js v6](https://ethers.org) wrapper for Claude with 40+ tools for Ethereum blockchain interactions. Works with 20+ EVM networks including Ethereum, Polygon, Arbitrum, Base, and more.

## Tool Categories

### 🔗 **Core Ethereum**
Network info • Block/transaction data • Wallet operations • Gas estimation • ENS resolution • Message signing • Unit conversion

### 🪙 **Token Standards** 
**ERC20**: Token info, balances, transfers, approvals  
**ERC721**: NFT info, ownership, transfers, metadata  
**ERC1155**: Multi-token balances, transfers, batch operations

### 📝 **Transaction Management**
Transaction preparation • ERC20/721/1155 transaction prep • Secure transaction broadcasting • Gas optimization

### 🔧 **Contract Interaction**
Smart contract calls • Contract code inspection • Custom ABI support

## Quick Example

```bash
# Get Vitalik's ETH balance
"getWalletBalance": {
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "provider": "mainnet"
}

# Get USDC token info
"erc20GetTokenInfo": {
  "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "provider": "mainnet"
}
```

## Installation

```bash
git clone https://github.com/yourusername/ethers-server.git
cd ethers-server
npm install
npm run build
```

### Environment Variables

Create `.env` file:
```
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key
DEFAULT_NETWORK=mainnet
```

## Advanced Setup

### Local Project
```bash
claude mcp add --scope local ethers-wallet --env ALCHEMY_API_KEY=your_key -- node /path/to/build/src/index.js
```

### Shared Team Config
```bash
claude mcp add --scope project ethers-wallet -- node /path/to/build/src/index.js
```

## Security

**🔐 Secure by Design**: Uses prepare → sign → send workflow. Private keys never stored on server. External signing supported (hardware wallets, offline signing).

**⚠️ API Keys**: Protect your `.env` file. Never expose Alchemy/Infura keys.

## Development

Built with ethers.js v6 for maximum compatibility and performance. Full TypeScript support with comprehensive error handling.

**Testing**: `npm test` (requires Hardhat local node)  
**Build**: `npm run build`

## Contributing

Contributions welcome! See our comprehensive test suite and follow existing code patterns.

## License

MIT License - Dennison Bertram (dennison@tally.xyz)

---

**🚀 Production Ready**: Successfully validated with live Ethereum mainnet transactions. Complete MCP server with 40+ tools for all your Web3 needs.