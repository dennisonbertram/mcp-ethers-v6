import { describe, expect, it, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';
import * as erc20 from '../services/erc/erc20.js';
import { EthersService } from '../services/ethersService.js';

describe('ERC20 Service Methods', () => {
  let testEnv: TestEnvironment;
  let testToken: TestToken;
  let ethersService: EthersService;
  let tokenAddress: string;
  let ownerAddress: string;
  let recipientAddress: string;

  beforeAll(async () => {
    // No need to mock anything - we use real contracts and chain
    testEnv = await getTestEnvironment();
    const signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    testToken = await deployTestToken(testEnv.provider, signer);
    tokenAddress = await testToken.getAddress();
    ownerAddress = await signer.getAddress();
    recipientAddress = await testEnv.signers[1].getAddress();
  });

  describe('Token Info', () => {
    it('should get basic token info', async () => {
      const tokenInfo = await erc20.getTokenInfo(
        ethersService,
        tokenAddress
      );

      expect(tokenInfo.name).toBe('MyToken');
      expect(tokenInfo.symbol).toBe('MCP');
      expect(Number(tokenInfo.decimals)).toBe(18);
    });
  });

  describe('Balance', () => {
    it('should get token balance for an address', async () => {
      const balance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        ownerAddress
      );

      // Initial supply should be 1000000 tokens
      expect(balance).toBe('1000000.0');
    });

    it('should handle zero balance for a valid address', async () => {
      const randomWallet = ethers.Wallet.createRandom();
      const randomAddress = await randomWallet.getAddress();
      
      const balance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        randomAddress
      );

      expect(balance).toBe('0.0');
    });
  });

  describe('Transfer', () => {
    it('should transfer tokens between accounts', async () => {
      const amount = '100.0';
      
      const initialBalance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        recipientAddress
      );
      
      await erc20.transfer(
        ethersService,
        tokenAddress,
        recipientAddress,
        amount
      );

      const finalBalance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        recipientAddress
      );
      
      const expectedBalance = (parseFloat(initialBalance) + parseFloat(amount)).toFixed(1);
      expect(finalBalance).toBe(expectedBalance);
    });

    it('should fail when transferring to invalid address', async () => {
      const amount = '10.0';
      
      await expect(erc20.transfer(
        ethersService,
        tokenAddress,
        '0x0000000000000000000000000000000000000000',
        amount
      )).rejects.toThrow();
    });

    it('should fail when transferring more than balance', async () => {
      const randomWallet = ethers.Wallet.createRandom().connect(testEnv.provider);
      const randomSigner = new EthersService(testEnv.provider, randomWallet);
      const randomAddress = await randomWallet.getAddress();
      
      // Try to transfer more than the wallet has
      const amount = '100.0';
      
      await expect(erc20.transfer(
        randomSigner,
        tokenAddress,
        recipientAddress,
        amount
      )).rejects.toThrow();
    });
  });

  describe('Allowance', () => {
    it('should approve and check allowance', async () => {
      const spender = await testEnv.signers[1].getAddress();
      const amount = '500.0';
      
      // Initially allowance should be zero
      const initialAllowance = await erc20.getAllowance(
        ethersService,
        tokenAddress,
        ownerAddress,
        spender
      );
      
      expect(initialAllowance).toBe('0.0');
      
      // Approve the allowance
      await erc20.approve(
        ethersService,
        tokenAddress,
        spender,
        amount
      );
      
      // Check the new allowance
      const finalAllowance = await erc20.getAllowance(
        ethersService,
        tokenAddress,
        ownerAddress,
        spender
      );
      
      expect(finalAllowance).toBe(amount);
    });
  });
}); 