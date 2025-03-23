# Test Failures Analysis and Fix Recommendations

## Issue Overview

The failing tests are using Jest-specific mocking functionality (`jest.mock()`) which is not compatible with Bun's test runner. Bun has its own testing API that differs from Jest in some ways.

## Failing Tests

1. `src/services/erc/erc20.test.ts.md`
2. `src/services/erc/erc721.test.ts.md`
3. `src/services/erc/erc1155.test.ts.md`

## Error Pattern

All failures exhibit the same pattern:
```
TypeError: jest.mock is not a function. (In 'jest.mock("../ethersService")', 'jest.mock' is undefined)
```

## Solution: Convert to Bun-Compatible Testing

### Approach 1: Use Bun's Mocking API

Bun provides its own mocking features which can replace Jest's:

```typescript
import { mock, spyOn } from 'bun:test';
```

For example, to mock a module in Bun:

```typescript
// Instead of:
// jest.mock('../ethersService');

// Use:
import { mock } from 'bun:test';
import * as ethersServiceModule from '../ethersService';

mock(ethersServiceModule);
```

### Approach 2: Create Test Doubles Without Mocking

A better approach would be to avoid mocking entirely and use actual test doubles:

1. Create a fake implementation of `EthersService` for testing
2. Use dependency injection to pass the fake service into the functions being tested

This approach aligns with your preference to avoid mocks.

### Example Refactoring

Here's how to refactor one of the tests:

```typescript
import { describe, expect, test, beforeAll, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { EthersService } from '../services/ethersService.js';
import * as erc20 from './erc20.js';

// Instead of mocking, create a test implementation
class TestEthersService extends EthersService {
  mockProvider: any = {
    getCode: () => Promise.resolve('0x123')
  };
  
  mockSigner: any = {
    getAddress: () => Promise.resolve('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
  };
  
  mockContract: any = {
    name: () => Promise.resolve('Test Token'),
    symbol: () => Promise.resolve('TEST'),
    decimals: () => Promise.resolve(18),
    totalSupply: () => Promise.resolve(ethers.parseEther('1000000')),
    balanceOf: () => Promise.resolve(ethers.parseEther('100')),
    transfer: () => Promise.resolve({ hash: '0xabcd', wait: () => Promise.resolve(null) })
  };
  
  constructor() {
    super();
  }
  
  getProvider() {
    return this.mockProvider;
  }
  
  getSigner() {
    return this.mockSigner;
  }
  
  // Override Contract creation
  createContract(address: string, abi: any) {
    return this.mockContract;
  }
}

// Create a test cache implementation
const testCache = {
  data: new Map(),
  get: (key: string) => testCache.data.get(key),
  set: (key: string, value: any) => testCache.data.set(key, value),
  delete: (key: string) => testCache.data.delete(key)
};

describe('ERC20 Helpers', () => {
  let service: TestEthersService;
  
  beforeEach(() => {
    service = new TestEthersService();
    testCache.data.clear();
  });
  
  test('should return token info', async () => {
    const result = await erc20.getTokenInfo(
      service,
      '0x1234567890123456789012345678901234567890'
    );
    
    expect(result.name).toBe('Test Token');
    expect(result.symbol).toBe('TEST');
    expect(result.decimals).toBe(18);
  });
  
  // Add more tests...
});
```

## Implementation Plan

1. Create test implementations for dependencies instead of using mocks
2. Refactor each test file to use these test implementations
3. Make cache a dependency that can be injected for testing purposes
4. Run tests with Bun to verify they work

## Longer-Term Solution

Consider separating the test files into:

1. Integration tests that use a real provider (like the passing tests)
2. Unit tests that use test doubles for dependencies 

This will make the tests more maintainable and less fragile. 