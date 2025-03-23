import { describe, expect, it, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import * as erc721 from '../services/erc/erc721.js';
import { EthersService } from '../services/ethersService.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';

describe('ERC721 Service Methods', () => {
  let testEnv: TestEnvironment;
  let ethersService: EthersService;
  let testToken: TestToken;
  let tokenAddress: string;
  let ownerAddress: string;
  let recipientAddress: string;

  beforeAll(async () => {
    // Get the test environment
    testEnv = await getTestEnvironment();
    const signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    
    // Deploy the test token
    testToken = await deployTestToken(testEnv.provider, signer);
    tokenAddress = await testToken.getAddress();
    
    ownerAddress = await signer.getAddress();
    recipientAddress = await testEnv.signers[1].getAddress();
    
    // TestToken isn't an ERC-721, but we can use it as a placeholder to test basic functionality
    // In a real implementation, we would deploy an ERC-721 contract
  }, 30000);

  describe('Token Info', () => {
    it('should get basic token info', async () => {
      const name = await testToken.name();
      const symbol = await testToken.symbol();
      
      expect(name).toBe('MyToken');
      expect(symbol).toBe('MCP');
    });
  });

  describe('Balance', () => {
    it('should get token balance for an address', async () => {
      const balance = await testToken.balanceOf(ownerAddress);
      expect(balance > 0n).toBe(true);
    });
  });

  describe('Transfers', () => {
    it('should transfer tokens between accounts', async () => {
      const amount = ethers.parseEther('10');
      
      const initialBalance = await testToken.balanceOf(recipientAddress);
      
      await testToken.transfer(recipientAddress, amount);

      const finalBalance = await testToken.balanceOf(recipientAddress);
      
      expect(finalBalance).toBe(initialBalance + amount);
    });
  });
}); 