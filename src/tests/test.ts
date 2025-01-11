import { describe, expect, test, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';
import { TestEnvironment } from './utils/hardhatTestProvider.js';

describe('Test', () => {
  let testEnv: TestEnvironment;
  let testToken: TestToken;
  let signer: ethers.Signer;

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
    signer = testEnv.signers[0];
    testToken = await deployTestToken(testEnv.provider, signer);
  });

  test('should deploy test token', async () => {
    expect(testToken).toBeDefined();
  });
}); 