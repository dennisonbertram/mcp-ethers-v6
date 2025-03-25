import { ethers } from 'ethers';

beforeAll(async () => {
  // Try to connect to the Hardhat node
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  try {
    await provider.getBlockNumber();
    console.log('Connected to Hardhat node');
  } catch (error) {
    console.error('Failed to connect to Hardhat node. Make sure it is running on http://localhost:8545');
    process.exit(1);
  }
}); 