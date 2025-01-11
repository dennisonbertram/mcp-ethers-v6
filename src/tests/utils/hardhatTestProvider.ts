import { ethers } from 'ethers';

export interface TestEnvironment {
  provider: ethers.Provider;
  signers: ethers.Signer[];
}

async function resetProvider(provider: ethers.JsonRpcProvider) {
  await provider.send('hardhat_reset', []);
  await provider.send('evm_setAutomine', [true]);
}

export async function getHardhatTestProvider(): Promise<TestEnvironment> {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  await resetProvider(provider);

  // Create signers from private keys
  const privateKeys = [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
  ];

  const signers = privateKeys.map(key => new ethers.Wallet(key, provider));

  return {
    provider,
    signers
  };
}

// Export some test constants
export const TEST_ACCOUNTS = {
  ALICE: 0,
  BOB: 1,
  CHARLIE: 2,
  DAVE: 3
} as const; 