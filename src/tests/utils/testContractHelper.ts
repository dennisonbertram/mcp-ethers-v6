import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

async function mineBlock(provider: ethers.Provider): Promise<void> {
  // Cast to JsonRpcProvider to access send method
  const jsonRpcProvider = provider as ethers.JsonRpcProvider;
  await jsonRpcProvider.send('evm_mine', []);
}

async function getNonceAfterMining(signer: ethers.Signer, provider: ethers.Provider): Promise<number> {
  // Mine a block to ensure all pending transactions are processed
  await mineBlock(provider);
  // Now get the nonce - it should be accurate since we've mined all pending transactions
  return provider.getTransactionCount(await signer.getAddress(), 'latest');
}

export interface TestTokenInterface {
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
  approve(spender: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
  transferFrom(from: string, to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
  mint(to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
  connect(signer: ethers.Signer): TestToken;
  getAddress(): Promise<string>;
}

export type TestToken = ethers.Contract & TestTokenInterface;

function getContractArtifact() {
  try {
    const artifactPath = path.join(process.cwd(), 'artifacts/contracts/TestToken.sol/TestToken.json');
    return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } catch (error) {
    console.error('Failed to read contract artifact:', error);
    throw new Error('Contract artifact not found. Make sure the contract is compiled.');
  }
}

function hasMethod(obj: any, method: string): boolean {
  return typeof obj[method] === 'function';
}

function isTestToken(contract: ethers.Contract): contract is TestToken {
  const requiredMethods = [
    'name',
    'symbol',
    'decimals',
    'totalSupply',
    'balanceOf',
    'transfer',
    'approve',
    'transferFrom',
    'mint',
    'connect',
    'getAddress'
  ];

  return requiredMethods.every(method => hasMethod(contract, method));
}

async function waitForTransaction(provider: ethers.Provider, hash: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await provider.getTransactionReceipt(hash);
      if (receipt) return;
    } catch (error) {
      // Ignore errors and keep trying
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Transaction ${hash} was not mined within ${maxAttempts} seconds`);
}

export async function deployTestToken(
  provider: ethers.Provider,
  signer: ethers.Signer
): Promise<TestToken> {
  const artifact = getContractArtifact();
  
  try {
    const nonce = await getNonceAfterMining(signer, provider);

    // Create and deploy contract with our nonce
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy({ nonce });
    await contract.waitForDeployment();
    
    const testToken = contract as unknown as TestToken;
    if (!isTestToken(testToken)) {
      throw new Error('Deployed contract does not implement TestToken interface');
    }
    return testToken;
  } catch (error) {
    console.error('Failed to deploy contract:', error);
    throw error;
  }
}

export async function getTestTokenAt(
  address: string,
  provider: ethers.Provider,
  signer?: ethers.Signer
): Promise<TestToken> {
  try {
    const artifact = getContractArtifact();
    
    const contract = new ethers.Contract(
      address,
      artifact.abi,
      signer || provider
    );

    // Verify the contract exists and has the expected interface
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error('No contract found at the specified address');
    }

    const testToken = contract as unknown as TestToken;
    if (!isTestToken(testToken)) {
      throw new Error('Contract at address does not implement TestToken interface');
    }
    return testToken;
  } catch (error) {
    console.error('Failed to get contract at address:', address, error);
    throw error;
  }
} 