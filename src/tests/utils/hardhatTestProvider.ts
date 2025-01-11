import { ethers } from 'ethers';
import hre from 'hardhat';

/**
 * Get a Hardhat test provider and pre-funded accounts for testing
 */
export async function getHardhatTestProvider() {
  // Get the provider from Hardhat
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Get the pre-funded accounts
  const accounts = await hre.ethers.getSigners();
  
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