import { ethers } from 'ethers';
import { connect } from 'net';

export interface TestEnvironment {
  provider: ethers.JsonRpcProvider;
  signers: ethers.Signer[];
}

const HARDHAT_PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
];

export const TEST_ACCOUNTS = {
  ACCOUNT_0: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  ACCOUNT_1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  ACCOUNT_2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
};

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
  });
}

async function checkNodeHealth(provider: ethers.JsonRpcProvider): Promise<boolean> {
  try {
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    return false;
  }
}

export async function getHardhatTestProvider(): Promise<TestEnvironment> {
  const port = 8545;
  const isRunning = await isPortInUse(port);
  
  if (!isRunning) {
    throw new Error('Hardhat node is not running. Please start it with: npx hardhat node --hostname 127.0.0.1 --port 8545');
  }

  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  const isHealthy = await checkNodeHealth(provider);
  if (!isHealthy) {
    throw new Error('Hardhat node is not responding correctly');
  }

  const signers = HARDHAT_PRIVATE_KEYS.map(key => new ethers.Wallet(key, provider));

  return {
    provider,
    signers,
  };
} 