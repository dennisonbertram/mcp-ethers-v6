import { ethers } from 'ethers';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { network } from 'hardhat';

// Hardhat's default private keys for testing
const TEST_PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
];

/**
 * Get a Hardhat test provider and pre-funded accounts for testing
 */
export async function getHardhatTestProvider() {
  // Get the provider from Hardhat
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Get the pre-funded accounts
  const accounts = await Promise.all(
    TEST_PRIVATE_KEYS.map((privateKey: string) => 
      new ethers.Wallet(privateKey, provider)
    )
  );
  
  // First account will be our default signer
  const defaultSigner = accounts[0];
  
  return {
    provider,
    accounts,
    defaultSigner,
    // Helper to get a new funded account
    getTestAccount: (index: number = 0) => accounts[index]
  };
}

// Export some test constants
export const TEST_ACCOUNTS = {
  ALICE: 0,  // First account
  BOB: 1,    // Second account
  CAROL: 2   // Third account
}; 