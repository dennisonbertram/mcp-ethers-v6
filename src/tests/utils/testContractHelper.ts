import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Interface for the TestToken contract
export interface TestToken extends ethers.BaseContract {
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  allowance(owner: string, spender: string): Promise<bigint>;
  transfer: {
    (to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
    (to: string, value: bigint, overrides: ethers.Overrides): Promise<ethers.ContractTransactionResponse>;
    estimateGas(to: string, value: bigint): Promise<bigint>;
  };
  approve: {
    (spender: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
    (spender: string, value: bigint, overrides: ethers.Overrides): Promise<ethers.ContractTransactionResponse>;
    estimateGas(spender: string, value: bigint): Promise<bigint>;
  };
  transferFrom: {
    (from: string, to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
    (from: string, to: string, value: bigint, overrides: ethers.Overrides): Promise<ethers.ContractTransactionResponse>;
    estimateGas(from: string, to: string, value: bigint): Promise<bigint>;
  };
  mint: {
    (to: string, value: bigint): Promise<ethers.ContractTransactionResponse>;
    (to: string, value: bigint, overrides: ethers.Overrides): Promise<ethers.ContractTransactionResponse>;
    estimateGas(to: string, value: bigint): Promise<bigint>;
  };
  connect(signer: ethers.Signer): TestToken;
  getAddress(): Promise<string>;
  interface: ethers.Interface;
}

export const TEST_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function mint(address,uint256)",
  "event Transfer(address indexed,address indexed,uint256)",
  "event Approval(address indexed,address indexed,uint256)"
];

export async function deployTestToken(signer: ethers.Signer): Promise<TestToken> {
  console.log('Creating contract factory...');
  
  // Read the compiled contract artifact
  const artifactPath = path.join(process.cwd(), 'artifacts/contracts/TestToken.sol/TestToken.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  
  console.log('Deploying contract...');
  const contract = await factory.deploy() as TestToken;
  await contract.waitForDeployment();
  
  return contract;
} 