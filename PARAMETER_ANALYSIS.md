# Parameter Naming Analysis

## Current State Analysis

### Address Parameters - INCONSISTENT
Found multiple patterns for address parameters:
- `address` - Used for single generic addresses (getWalletBalance)
- `tokenAddress` - Used for token contract addresses (ERC20, ERC721, ERC1155)
- `contractAddress` - Used for generic contract addresses (callContractMethod)
- `ownerAddress` - Used for token owner addresses
- `spenderAddress` - Used for ERC20 allowance spender
- `fromAddress` - Used for transfer source
- `toAddress` - Used for transfer destination
- `walletAddress` - Not currently used but expected

### Amount/Value Parameters - INCONSISTENT
- `amount` - Used for token amounts (string)
- `value` - Used for ETH value in transactions (string)
- `balance` - Not used as parameter, only in responses
- No `amountInWei` parameter found

### Network Parameters - CONSISTENT
- `provider` - Used consistently for network/RPC URL
- `chainId` - Used consistently for chain ID
- `network` - Not used as parameter

### Block Parameters - PARTIALLY CONSISTENT
- `blockNumber` - Used in some places
- `fromBlock`/`toBlock` - Used for ranges
- `blockHash` - Used for specific blocks

## Standardization Plan

### Address Parameters
**Standard Convention:**
```typescript
// For single addresses by role:
address: string           // Generic address (e.g., getBalance)
contractAddress: string   // Any contract address
fromAddress: string       // Transfer source
toAddress: string         // Transfer destination  
ownerAddress: string      // Token/asset owner
spenderAddress: string    // ERC20 spender
operatorAddress: string   // ERC1155 operator

// DEPRECATED (to be replaced):
tokenAddress -> contractAddress  // Use contractAddress for all token contracts
walletAddress -> address         // Use address for wallet addresses
```

### Amount/Value Parameters
**Standard Convention:**
```typescript
amount: string           // Token amounts (human-readable, e.g., "1.5")
value: string           // ETH value in wei for transactions
```

### Implementation Strategy

1. **Phase 1**: Create mapping layer for backward compatibility
2. **Phase 2**: Update all tool definitions to use standard names
3. **Phase 3**: Update handlers and services
4. **Phase 4**: Update tests
5. **Phase 5**: Add deprecation notices

## Files to Update

### Tool Definition Files (Priority 1)
- `/src/tools/core.ts` - Update address parameters
- `/src/tools/erc20.ts` - Replace tokenAddress with contractAddress
- `/src/tools/erc721.ts` - Replace tokenAddress with contractAddress  
- `/src/tools/erc1155.ts` - Replace tokenAddress with contractAddress
- `/src/tools/handlers/erc20.ts` - Update all address parameters
- `/src/tools/handlers/erc721.ts` - Update all address parameters
- `/src/tools/handlers/erc1155.ts` - Update all address parameters

### Service Files (Priority 2)
- `/src/services/ethersService.ts` - Update method signatures
- `/src/services/erc/erc20.ts` - Update parameter names
- `/src/services/erc/erc721.ts` - Update parameter names
- `/src/services/erc/erc1155.ts` - Update parameter names

### Test Files (Priority 3)
- All test files in `/src/tests/` - Update to use new parameter names

## Backward Compatibility Strategy

To maintain backward compatibility:
1. Accept both old and new parameter names initially
2. Map old names to new names internally
3. Add deprecation warnings when old names are used
4. Document migration path in MIGRATION.md