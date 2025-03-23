# MCP Client Testing Implementation Plan

## Overview

This implementation plan outlines the strategy for creating a comprehensive testing suite for the Ethers MCP server using a proper MCP client over stdio. The tests will use Bun for faster execution and will focus on testing the actual MCP server implementation through the standardized MCP protocol.

## Goals

1. Create a robust test suite that validates the MCP protocol implementation
2. Test all exposed Ethereum tools through the MCP interface
3. Ensure bidirectional communication works correctly over stdio
4. Provide clear error reporting and diagnostics
5. Maintain high test performance using Bun

## Existing Tests Checklist

The following tests already exist in the codebase and will not be modified:

### Integration Tests (EthersService)
- [x] Contract Methods Tests (`src/tests/contract-methods.test.ts`)
- [x] Write Methods Tests (`src/tests/write-methods.test.ts`)
- [x] ERC20 Methods Tests (`src/tests/erc20-methods.test.ts`)
- [x] ERC721 Methods Tests (`src/tests/erc721-methods.test.ts`)
- [x] ERC1155 Methods Tests (`src/tests/erc1155-methods.test.ts`)

### Service Unit Tests
- [x] ERC20 Service Tests (`src/services/erc/erc20.test.ts`)
- [x] ERC721 Service Tests (`src/services/erc/erc721.test.ts`)
- [x] ERC1155 Service Tests (`src/services/erc/erc1155.test.ts`)

### MCP Client Tests (Partial Implementation)
- [x] Basic Tests (`src/tests/client/suites/basicTests.ts`)
- [x] Wallet Tests (`src/tests/client/suites/walletTests.ts`)

## Implementation Checklist

### 1. Client Testing Framework

- [ ] Create a new test runner specifically for MCP client tests (`src/tests/mcp-client/runClientTests.ts`)
- [ ] Implement a Bun-specific test runner configuration
- [ ] Add a comprehensive reporting mechanism for client test results
- [ ] Configure proper test timeouts and retry mechanisms

### 2. MCP Client Implementation

- [ ] Enhance the existing McpStandardClient to support all MCP operations
- [ ] Implement proper error handling and logging
- [ ] Add connection management with graceful cleanup
- [ ] Create helper methods for common testing patterns

### 3. Test Suites

#### Core Functionality Tests
- [ ] Connection Tests
  - [ ] Initialize connection
  - [ ] Negotiate capabilities
  - [ ] Handle reconnection
  - [ ] Test error scenarios

- [ ] Tool Discovery Tests
  - [ ] List all tools
  - [ ] Validate tool metadata
  - [ ] Verify required tools exist

#### Ethereum Tests

- [ ] Network Tests
  - [ ] Get supported networks
  - [ ] Get network details
  - [ ] Validate network configurations

- [ ] Block Tests
  - [ ] Get block number
  - [ ] Get block details
  - [ ] Test block parsing

- [ ] Transaction Tests
  - [ ] Get transaction details
  - [ ] Estimate gas
  - [ ] Validate transaction data

- [ ] Wallet Tests
  - [ ] Check wallet exists
  - [ ] Get wallet balance
  - [ ] Get transaction count

- [ ] Contract Tests
  - [ ] Get contract code
  - [ ] Test contract calls
  - [ ] Validate ABI parsing

- [ ] ERC Token Tests
  - [ ] ERC20 token operations
  - [ ] ERC721 token operations
  - [ ] ERC1155 token operations

### 4. Testing Utilities

- [ ] Create assertion helpers specific to MCP responses
- [ ] Implement test fixtures for common scenarios
- [ ] Add helpers for validating Ethereum data structures
- [ ] Create mock data generators for testing

### 5. Test Scripts

- [ ] Add npm/bun scripts for running client tests specifically
- [ ] Create a test script for running all tests
- [ ] Add a script for generating test reports
- [ ] Implement CI integration

## Test Categories to Implement

We'll implement the following test categories to fully validate the MCP server:

### 1. Network-related Tools
- [ ] `getSupportedNetworks`
- [ ] `getBlockNumber`
- [ ] `getBlockDetails`
- [ ] `getGasPrice`
- [ ] `getFeeData`

### 2. Wallet Operations
- [ ] `generateWallet`
- [ ] `loadWallet`
- [ ] `checkWalletExists`
- [ ] `getWalletBalance`
- [ ] `getWalletTransactionCount`

### 3. Transaction Management
- [ ] `getTransactionDetails`
- [ ] `sendTransaction` (mock mode)
- [ ] `sendTransactionWithOptions` (mock mode)

### 4. Contract Interaction
- [ ] `contractCall` (mock mode)
- [ ] `contractCallView`
- [ ] `getContractCode`

### 5. Token Operations
- [ ] `getERC20TokenInfo`
- [ ] `getERC20Balance`
- [ ] `getERC721CollectionInfo`
- [ ] `getERC721Owner`
- [ ] `getERC1155Balance`

### 6. Utility Operations
- [ ] `formatEther`
- [ ] `parseEther`
- [ ] `formatUnits`

## Implementation Strategy

1. **Incremental Development**: Implement test suites one category at a time
2. **Test-Driven Development**: Write the test expectations first, then implement the client functionality
3. **Continuous Testing**: Run tests frequently to catch regressions early
4. **Documentation**: Document test cases and expected results clearly

## Specific Implementation Steps

1. Create the basic framework and runner
2. Implement the first test category (Network-related tools)
3. Add remaining test categories incrementally
4. Finalize reporting and documentation
5. Create a PR with comprehensive results

## Timeline

1. **Phase 1 (Days 1-2)**: Framework setup and core tests
2. **Phase 2 (Days 3-4)**: Network and wallet tests
3. **Phase 3 (Days 5-6)**: Transaction and contract tests
4. **Phase 4 (Days 7-8)**: Token operation tests
5. **Phase 5 (Days 9-10)**: Final tests, documentation, and PR

## Success Criteria

1. All test categories implemented and passing
2. Clear test reports generated
3. Edge cases and error scenarios covered
4. All MCP tools tested
5. Documentation updated with testing instructions 