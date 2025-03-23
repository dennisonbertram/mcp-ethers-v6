# MCP Tools Implementation Checklist

This document tracks the tools that need to be implemented in the MCP Ethers server.

## Block-Related Tools
- [x] `getBlockDetails` - Get details about a specific block

## Transaction-Related Tools
- [x] `getTransactionDetails` - Get details about a specific transaction
- [x] `getWalletTransactionCount` - Get number of transactions sent by an address

## Utility Tools
- [x] `formatEther` - Convert wei to ether
- [x] `parseEther` - Convert ether to wei
- [x] `formatUnits` - Format with custom decimal units

## Contract Tools
- [x] `getContractCode` - Get contract bytecode
- [x] `contractCall` - Call contract read-only methods

## ERC20 Token Tools
- [x] `erc20_balanceOf` - Get ERC20 token balance 
- [x] `erc20_getTokenInfo` - Get ERC20 token information

## ERC721 (NFT) Tools
- [ ] `erc721_balanceOf` - Get NFT balance
- [ ] `erc721_tokenURI` - Get NFT token URI

## ERC1155 Tools
- [ ] `erc1155_balanceOf` - Get ERC1155 token balance
- [ ] `erc1155_uri` - Get ERC1155 token URI
- [ ] `erc1155_balanceOfBatch` - Get batch of ERC1155 balances

## Working Tools
- ✅ Network-related tools (getSupportedNetworks)
- ✅ Wallet balance checking
- ✅ Wallet generation
- ✅ Gas price and fee data

## Implementation Notes
- Follow MCP TypeScript SDK standards exactly
- Implement each tool according to the SDK specifications
- Ensure proper error handling and response formatting
- Test each tool after implementation 