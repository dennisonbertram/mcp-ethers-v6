import { afterAll, beforeAll } from '@jest/globals';
import { getHardhatTestProvider, TestEnvironment } from './hardhatTestProvider.js';

// Global test environment that can be reused between tests
let testEnvironment: TestEnvironment | null = null;

// Get (or initialize) the test environment
export async function getTestEnvironment(): Promise<TestEnvironment> {
  if (!testEnvironment) {
    testEnvironment = await getHardhatTestProvider();
  }
  return testEnvironment;
}

// Global setup for all tests to share the same Hardhat provider
beforeAll(async () => {
  if (!testEnvironment) {
    testEnvironment = await getTestEnvironment();
  }
});

// Clean up resources
afterAll(async () => {
  // Add any necessary cleanup here
  testEnvironment = null;
}); 