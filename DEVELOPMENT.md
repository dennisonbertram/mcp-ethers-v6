# Parameter Naming Standardization Task

## Objective
Standardize parameter naming across all MCP tools to improve consistency and usability.

## Success Criteria
- [x] All address-related parameters use consistent naming
- [x] All amount/value parameters use consistent naming  
- [x] All network/chain parameters use consistent naming
- [x] All block-related parameters use consistent naming
- [x] Backward compatibility maintained or clear migration path provided
- [ ] All tools tested and working with new parameter names

## Implementation Plan

### Phase 1: Analysis
- [x] Identify all tool definition files
- [x] Document current parameter naming patterns
- [x] Identify inconsistencies and conflicts
- [x] Define standardized naming conventions

### Phase 2: Implementation  
- [x] Update tool schemas and definitions
- [x] Update parameter validation code
- [x] Update type definitions
- [x] Ensure backward compatibility

### Phase 3: Testing & Verification
- [ ] Manual testing of all tools
- [ ] Verify no breaking changes
- [x] Document any migration requirements

## Parameter Naming Conventions

### Standard Conventions (To Be Applied):
- **Addresses**: Use `address` for single addresses, `addresses` for arrays
  - Exception: `fromAddress`, `toAddress` for transfers
  - Exception: `ownerAddress`, `spenderAddress` for specific roles
- **Amounts**: Use `amount` for values, `amountInWei` when specifically in wei
- **Networks**: Use `network` for network names/identifiers
- **Blocks**: Use `blockNumber` for specific blocks, `fromBlock`/`toBlock` for ranges
- **Hashes**: Use `transactionHash` for tx hashes, `blockHash` for block hashes

## Progress Log
- Started: 2025-08-27
- Created worktree: feature/standardize-parameter-naming