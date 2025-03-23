# Implementation Plan: Network Switching Tests

## Overview
This implementation plan outlines the approach for enhancing our existing MCP client tests to validate the ability to operate on different networks and switch between them seamlessly. By implementing these tests, we'll ensure that our ethers-server can properly handle network-specific operations across our supported networks.

## Current State Analysis
Currently, our MCP client tests execute on a default network (typically Ethereum mainnet or a local Hardhat node). We have basic tests for:
- Listing supported networks (`getSupportedNetworks`)
- Getting block number (`getBlockNumber`)
- Getting gas price (`getGasPrice`)
- Getting fee data (`getFeeData`)

However, these tests don't validate:
1. Actual network switching capabilities
2. Operation across multiple networks
3. Network-specific behavior
4. Error handling for invalid network requests

## Objectives
1. Verify that the `provider` parameter correctly switches networks for operations
2. Test interactions with multiple real networks in sequence
3. Validate network-specific data and behaviors
4. Test error handling for invalid network parameters
5. Ensure consistent behavior across all supported networks
6. Test chain ID parameter usage and validation

## Implementation Strategy

### 1. Create a Network Test Configuration Module

Create a new module `networkTestConfig.ts` that will:
- Define test networks to use (focusing on testnets to avoid costs)
- Specify network-specific test data (addresses, contracts, expected values)
- Include validation parameters for each network
- Flag networks that should be skipped if API keys aren't available

```typescript
export const TEST_NETWORKS = {
  // Use testnets where possible
  "Ethereum": {
    rpcName: "sepolia",
    chainId: 11155111,
    expectedCurrency: "ETH",
    testAddress: "0x...", // Known address with balance on Sepolia
    expectedBlockTimeRange: [1, 15], // seconds
  },
  "Polygon PoS": {
    rpcName: "polygon",
    chainId: 137,
    expectedCurrency: "POL",
    testAddress: "0x...",
    expectedBlockTimeRange: [1, 3],
  },
  "Monad Testnet": {
    rpcName: "monad",
    chainId: 10143,
    expectedCurrency: "MON",
    testAddress: "0x...",
    expectedBlockTimeRange: [1, 5],
  },
  // Add more testable networks as needed
};
```

### 2. Enhance Existing Network Tests

Update `networkTests.ts` to include:

#### A. Network Validation Test
Test that each supported network can be queried for basic information:

```typescript
{
  name: 'Validate supported networks',
  test: async () => {
    const result = await client.callTool('getSupportedNetworks', {});
    assertToolSuccess(result, 'Failed to get supported networks');
    
    // Parse the JSON response from text content
    const networkText = result.content.find(item => item.type === 'text')?.text || '';
    const networks = JSON.parse(networkText);
    
    // Verify each network has required properties
    networks.forEach(network => {
      assert(network.name, 'Network is missing name property');
      assert(typeof network.chainId === 'number', 'Network is missing valid chainId');
      assert(network.nativeCurrency?.symbol, 'Network is missing currency symbol');
    });
    
    // Verify our test networks are present
    for (const [name, config] of Object.entries(TEST_NETWORKS)) {
      const found = networks.find(n => n.name === name);
      assert(found, `Test network ${name} not found in supported networks`);
      assert(found.chainId === config.chainId, 
        `Chain ID mismatch for ${name}: expected ${config.chainId}, got ${found.chainId}`);
    }
  }
}
```

#### B. Network Switching Test
Test that we can get block numbers from different networks:

```typescript
{
  name: 'Switch between networks',
  test: async () => {
    // Get block numbers from multiple networks sequentially
    const results = [];
    
    for (const [name, config] of Object.entries(TEST_NETWORKS)) {
      try {
        logger.info(`Testing block number on ${name} (${config.rpcName})`);
        const result = await client.callTool('getBlockNumber', {
          provider: config.rpcName
        });
        
        assertToolSuccess(result, `Failed to get block number on ${name}`);
        const blockNumberText = result.content.find(item => item.type === 'text')?.text || '';
        const blockNumber = parseInt(blockNumberText.match(/\d+/)?.[0] || '0');
        
        assert(blockNumber > 0, `Invalid block number on ${name}: ${blockNumberText}`);
        results.push({ network: name, blockNumber });
      } catch (error) {
        logger.warn(`Test failed for network ${name}`, { error });
        // Don't fail entire test if one network fails
      }
    }
    
    // Ensure we got results from at least 2 networks
    assert(results.length >= 2, 'Failed to get block numbers from multiple networks');
    logger.info('Successfully retrieved block numbers from multiple networks', { results });
  }
}
```

#### C. Chain ID Parameter Test
Test that the chainId parameter is validated correctly:

```typescript
{
  name: 'Validate chainId parameter',
  test: async () => {
    // Test with valid chainId
    const validResult = await client.callTool('getBlockNumber', {
      chainId: 1 // Ethereum mainnet
    });
    assertToolSuccess(validResult, 'Failed with valid chainId');
    
    // Test with mismatched chainId and provider
    try {
      const mismatchResult = await client.callTool('getBlockNumber', {
        provider: 'ethereum',
        chainId: 137 // Polygon chainId with Ethereum provider
      });
      // This should fail with a specific error about chain ID mismatch
      assert(
        mismatchResult.isError && 
        mismatchResult.content[0]?.text?.includes('mismatch'),
        'Did not properly detect chainId mismatch'
      );
    } catch (error) {
      // If it throws directly, that's also acceptable
    }
  }
}
```

### 3. Create Network-Specific Operational Tests

Create a new test file `networkOperationsTests.ts` for cross-network operations:

```typescript
export function getNetworkOperationsTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get wallet balance across networks',
      test: async () => {
        for (const [name, config] of Object.entries(TEST_NETWORKS)) {
          if (!config.testAddress) continue;
          
          const result = await client.callTool('getWalletBalance', {
            address: config.testAddress,
            provider: config.rpcName
          });
          
          assertToolSuccess(result, `Failed to get balance on ${name}`);
          const balanceText = result.content.find(item => item.type === 'text')?.text || '';
          
          // Verify it contains a number and the correct currency
          assert(
            /[\d\.]+/.test(balanceText) && 
            balanceText.includes(config.expectedCurrency),
            `Balance response on ${name} does not contain expected currency: ${balanceText}`
          );
        }
      }
    },
    
    {
      name: 'Get gas prices across networks',
      test: async () => {
        const gasPrices = [];
        
        for (const [name, config] of Object.entries(TEST_NETWORKS)) {
          try {
            const result = await client.callTool('getGasPrice', {
              provider: config.rpcName
            });
            
            assertToolSuccess(result, `Failed to get gas price on ${name}`);
            const gasPriceText = result.content.find(item => item.type === 'text')?.text || '';
            
            // Extract gas price value (assuming format like "X gwei")
            const match = gasPriceText.match(/([\d\.]+)\s*(\w+)/);
            if (match) {
              const [_, value, unit] = match;
              gasPrices.push({
                network: name,
                value: parseFloat(value),
                unit,
                text: gasPriceText
              });
            }
          } catch (error) {
            logger.warn(`Failed to get gas price for ${name}`, { error });
          }
        }
        
        // Verify we got gas prices from multiple networks
        assert(gasPrices.length >= 2, 'Failed to get gas prices from multiple networks');
        
        // Verify gas prices are different (they should be on different networks)
        const allSame = gasPrices.every(gp => gp.value === gasPrices[0].value);
        assert(!allSame, 'All gas prices are identical, which is unlikely across different networks');
      }
    },
    
    {
      name: 'Compare block times across networks',
      test: async () => {
        const blockTimes = [];
        
        for (const [name, config] of Object.entries(TEST_NETWORKS)) {
          try {
            // Get latest block
            const blockResult = await client.callTool('getBlockDetails', {
              blockTag: 'latest',
              provider: config.rpcName
            });
            
            assertToolSuccess(blockResult, `Failed to get latest block on ${name}`);
            const blockText = blockResult.content.find(item => item.type === 'text')?.text || '';
            
            // Get previous block
            const prevBlockResult = await client.callTool('getBlockDetails', {
              blockTag: 'latest - 1',
              provider: config.rpcName
            });
            
            assertToolSuccess(prevBlockResult, `Failed to get previous block on ${name}`);
            const prevBlockText = prevBlockResult.content.find(item => item.type === 'text')?.text || '';
            
            // Extract timestamps (simplified - in real tests, would need more robust parsing)
            const latestTime = extractTimestampFromBlockText(blockText);
            const prevTime = extractTimestampFromBlockText(prevBlockText);
            
            if (latestTime && prevTime) {
              const blockTime = latestTime - prevTime;
              blockTimes.push({
                network: name,
                blockTime
              });
              
              // Verify block time is within expected range
              if (config.expectedBlockTimeRange) {
                const [min, max] = config.expectedBlockTimeRange;
                assert(
                  blockTime >= min && blockTime <= max,
                  `Block time for ${name} (${blockTime}s) outside expected range (${min}-${max}s)`
                );
              }
            }
          } catch (error) {
            logger.warn(`Failed to compare block times for ${name}`, { error });
          }
        }
        
        // Verify we got block times from multiple networks
        assert(blockTimes.length >= 2, 'Failed to get block times from multiple networks');
        logger.info('Block times across networks', { blockTimes });
      }
    }
  ];
}

// Helper function to extract timestamp from block details text
function extractTimestampFromBlockText(text: string): number | null {
  const match = text.match(/timestamp[\":\s]+(\d+)/i);
  return match ? parseInt(match[1]) : null;
}
```

### 4. Update Test Runner

Update `runClientTests.ts` to include the new network operations tests:

```typescript
// Import the new test suite
import { getNetworkOperationsTests } from './suites/networkOperationsTests.js';

// In the main function, add the new test suite:
testSuites.set('NetworkOperations', getNetworkOperationsTests(client));
```

### 5. Create Test Environment Preparation

Create a new utility to set up the test environment:

```typescript
// src/tests/mcp-client/utils/networkTestSetup.ts

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { logger } from '../../../utils/logger.js';
import { TEST_NETWORKS } from './networkTestConfig.js';

/**
 * Determine which networks are available for testing based on configuration and API keys
 */
export async function determineAvailableNetworks(client: McpStandardClient): Promise<string[]> {
  try {
    // Get list of supported networks
    const result = await client.callTool('getSupportedNetworks', {});
    if (!result || result.isError) {
      logger.warn('Failed to get supported networks', { result });
      return [];
    }
    
    const networkText = result.content.find(item => item.type === 'text')?.text || '';
    const networks = JSON.parse(networkText);
    
    // Filter to only include networks in our test config
    const availableNetworks = networks
      .filter(network => Object.keys(TEST_NETWORKS).includes(network.name))
      .map(network => network.name);
    
    // Verify each one is actually accessible
    const accessibleNetworks = [];
    for (const network of availableNetworks) {
      try {
        const config = TEST_NETWORKS[network];
        const blockResult = await client.callTool('getBlockNumber', {
          provider: config.rpcName
        });
        
        if (!blockResult.isError) {
          accessibleNetworks.push(network);
        }
      } catch (error) {
        logger.debug(`Network ${network} is not accessible`, { error });
      }
    }
    
    logger.info(`${accessibleNetworks.length} networks available for testing`, { 
      networks: accessibleNetworks 
    });
    return accessibleNetworks;
  } catch (error) {
    logger.error('Error determining available networks', { error });
    return [];
  }
}
```

## Implementation Steps

1. **Create Network Configuration**
   - Create `src/tests/mcp-client/utils/networkTestConfig.ts` with test network configurations
   - Ensure test addresses have funds on respective networks
   - Document requirements for each network in comments

2. **Enhance Network Tests**
   - Update `src/tests/mcp-client/suites/networkTests.ts` with additional tests
   - Add network validation tests
   - Add network switching tests
   - Add chainId parameter tests

3. **Create Network Operations Tests**
   - Create `src/tests/mcp-client/suites/networkOperationsTests.ts`
   - Implement cross-network functional tests
   - Test network-specific behavior

4. **Update Test Runner**
   - Modify `src/tests/mcp-client/runClientTests.ts` to include new test suites
   - Add conditional logic to skip tests for unavailable networks

5. **Environment Setup**
   - Create `src/tests/mcp-client/utils/networkTestSetup.ts`
   - Implement test environment setup utilities

6. **Create Test Data**
   - Define test contracts and addresses for each network
   - Create a mechanism to skip tests requiring funds if not available

7. **Update Documentation**
   - Update README with network testing documentation
   - Document required API keys and test addresses

## Detailed Implementation Checklist

### Phase 1: Network Configuration and Test Setup (Days 1-2)
- [ ] **Network Configuration**
  - [ ] Create `src/tests/mcp-client/utils/networkTestConfig.ts`
  - [ ] Define at least 3 test networks (Ethereum testnet, Polygon, Monad Testnet)
  - [ ] Add chain IDs, RPC names, and expected currencies
  - [ ] Add expected block time ranges for each network
  - [ ] Document test address requirements

- [ ] **Environment Setup**
  - [ ] Create `src/tests/mcp-client/utils/networkTestSetup.ts`
  - [ ] Implement `determineAvailableNetworks()` function
  - [ ] Add error handling for network connectivity issues
  - [ ] Create test helper for extracting data from tool responses
  - [ ] Test utility to check if networks are accessible

- [ ] **Test Infrastructure**
  - [ ] Update Jest/Bun test configuration if needed
  - [ ] Set up test timeout parameters for network operations
  - [ ] Create utility for conditional test execution based on network availability
  - [ ] Set up environment variable detection for API keys

### Phase 2: Basic Network Tests and Validation (Days 3-5)
- [ ] **Network Tests Enhancement**
  - [ ] Update `src/tests/mcp-client/suites/networkTests.ts`
  - [ ] Add test for validating supported networks list
  - [ ] Add network properties validation test
  - [ ] Create test for network switching functionality
  - [ ] Implement chain ID parameter validation test
  - [ ] Add error handling tests for invalid network requests

- [ ] **Test Runner Updates**
  - [ ] Update `src/tests/mcp-client/runClientTests.ts`
  - [ ] Add network detection before running network-specific tests
  - [ ] Implement conditional test execution logic
  - [ ] Add reporting for skipped networks
  - [ ] Update test suite organization

- [ ] **Initial Testing**
  - [ ] Run basic network tests on at least 2 networks
  - [ ] Debug and fix any issues with test configuration
  - [ ] Document any network-specific behaviors

### Phase 3: Cross-Network Operational Tests (Days 6-8)
- [ ] **Network Operations Tests**
  - [ ] Create `src/tests/mcp-client/suites/networkOperationsTests.ts`
  - [ ] Implement wallet balance check across networks test
  - [ ] Create gas price comparison test
  - [ ] Implement block time comparison test
  - [ ] Add contract deployment verification if applicable
  - [ ] Create token balance check test if applicable

- [ ] **Advanced Network Tests**
  - [ ] Implement rapid network switching test
  - [ ] Add test for network-specific features if applicable
  - [ ] Create connection resilience test
  - [ ] Add test for network timeout handling

- [ ] **Test Data Setup**
  - [ ] Create or identify contract addresses for each test network
  - [ ] Set up test wallet with small balances on test networks
  - [ ] Document test data requirements

### Phase 4: Test Refinement and Documentation (Days 9-10)
- [ ] **Test Refinement**
  - [ ] Review and refine all network tests
  - [ ] Optimize test execution time
  - [ ] Add more detailed assertions and error messages
  - [ ] Create helper functions for common test operations
  - [ ] Ensure tests work in CI/CD environment

- [ ] **Documentation**
  - [ ] Update README with network testing documentation
  - [ ] Document API key requirements for each network
  - [ ] Create examples of how to run network-specific tests
  - [ ] Document known issues or limitations
  - [ ] Add troubleshooting section for common test failures

- [ ] **Finalization**
  - [ ] Perform full test suite run on all available networks
  - [ ] Document test coverage and results
  - [ ] Create final pull request with all changes
  - [ ] Address feedback and make final adjustments

## Challenges and Considerations

1. **API Key Management**:
   - Tests will need API keys for various networks
   - We should gracefully skip tests when keys aren't available

2. **Network Reliability**:
   - Public testnets can be unreliable
   - Tests should handle timeouts and temporary failures

3. **Test Performance**:
   - Cross-network tests will be slower
   - Consider parallel execution where possible

4. **Test Data**:
   - Create or identify contracts deployed on multiple networks
   - Maintain test addresses with small balances for testing

## Success Criteria

The implementation will be considered successful when:

1. All tests pass across at least 3 different networks
2. Tests gracefully handle networks that are unavailable
3. Tests verify all network-specific operations
4. Documentation clearly explains how to run the network tests
5. CI/CD pipeline includes these tests (optionally with subset of networks)

## Timeline

1. **Phase 1 (2 days)**: Network configuration and test setup
2. **Phase 2 (3 days)**: Basic network tests and validation
3. **Phase 3 (3 days)**: Cross-network operational tests
4. **Phase 4 (2 days)**: Test refinement and documentation

## Next Steps After Implementation

1. Expand to include more networks (when available)
2. Create specialized tests for network-specific features
3. Add performance benchmarking across networks
4. Implement network failure simulation tests 