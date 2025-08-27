# Parameter Naming Migration Guide

## Overview
This guide documents the standardization of parameter names across all MCP tools to improve consistency and usability.

## Migration Summary

### Parameter Changes

#### Address Parameters
| Old Parameter Name | New Parameter Name | Affected Tools |
|-------------------|-------------------|----------------|
| `tokenAddress` | `contractAddress` | ERC20, ERC721*, ERC1155 tools |
| `walletAddress` | `address` | Wallet-related tools (if any) |

*Note: ERC721 tools already used `contractAddress` consistently.

#### Other Parameters
All other parameters remain unchanged:
- `ownerAddress` - Used for token/asset owners
- `spenderAddress` - Used for ERC20 spenders
- `fromAddress` - Used for transfer sources
- `toAddress` - Used for transfer destinations
- `operatorAddress` - Used for ERC1155 operators
- `amount` - Used for token amounts
- `value` - Used for ETH values in wei
- `provider` - Used for network/RPC URLs
- `chainId` - Used for chain IDs

## Backward Compatibility

### Deprecation Strategy
1. **Both parameters accepted**: Tools now accept both old and new parameter names
2. **Automatic mapping**: Old parameter names are automatically mapped to new names
3. **Deprecation warnings**: Using old parameter names logs a warning message
4. **Priority**: If both old and new parameters are provided, the new parameter takes precedence

### Example Usage

#### Before (Deprecated)
```typescript
// Using tokenAddress (deprecated)
await callTool('getERC20TokenInfo', {
  tokenAddress: '0x...', // Will show deprecation warning
  provider: 'mainnet'
});
```

#### After (Recommended)
```typescript
// Using contractAddress (standardized)
await callTool('getERC20TokenInfo', {
  contractAddress: '0x...', // Preferred
  provider: 'mainnet'
});
```

## Affected Tools

### ERC20 Tools
- `getERC20TokenInfo` / `erc20_getTokenInfo`
- `getERC20Balance` / `erc20_balanceOf`
- `getERC20Allowance`
- `transferERC20`
- `approveERC20`

### ERC1155 Tools
- `erc1155_balanceOf`
- `erc1155_uri`
- All other ERC1155 methods

### ERC721 Tools
No changes required - already using `contractAddress`.

## Migration Timeline

### Phase 1: Current Release
- Both old and new parameter names accepted
- Deprecation warnings logged when using old names
- Full backward compatibility maintained

### Phase 2: Future Release (TBD)
- Deprecation warnings become more prominent
- Documentation updated to only show new parameter names

### Phase 3: Major Version (TBD)
- Old parameter names removed
- Breaking change requiring migration

## Migration Steps for Clients

1. **Identify usage**: Search your codebase for `tokenAddress` parameters
2. **Update gradually**: Replace `tokenAddress` with `contractAddress`
3. **Test thoroughly**: Ensure all tools work with new parameter names
4. **Monitor logs**: Check for deprecation warnings in logs

## Benefits of Standardization

1. **Consistency**: All contract addresses use the same parameter name
2. **Clarity**: Parameter names clearly indicate their purpose
3. **Maintainability**: Easier to understand and maintain the codebase
4. **Future-proof**: Aligned with industry standards and best practices

## Support

If you encounter any issues during migration:
1. Check this migration guide
2. Review the deprecation warnings in logs
3. Open an issue on the GitHub repository

## Code Examples

### Complete Migration Example

```typescript
// Old code (deprecated)
const tokenInfo = await client.callTool('getERC20TokenInfo', {
  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  provider: 'mainnet'
});

const balance = await client.callTool('erc20_balanceOf', {
  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA27',
  provider: 'mainnet'
});

// New code (standardized)
const tokenInfo = await client.callTool('getERC20TokenInfo', {
  contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  provider: 'mainnet'
});

const balance = await client.callTool('erc20_balanceOf', {
  contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA27',
  provider: 'mainnet'
});
```