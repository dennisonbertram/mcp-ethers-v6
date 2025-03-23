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
    // Get test environment with provider and signers
    testEnv = await getTestEnvironment();
    
    // We need to ensure we have a chainId for the local environment
    const network = await testEnv.provider.getNetwork();
    if (!network || !network.chainId) {
      console.log('Using hardcoded chainId 31337 for Hardhat network');
      (testEnv.provider as any)._network = { 
        chainId: 31337,
        name: 'hardhat'
      };
    }
    
    const signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    
    // Deploy real token contract
    testToken = await deployTestToken(testEnv.provider, signer);
    tokenAddress = await testToken.getAddress();
    
    ownerAddress = await signer.getAddress();
    recipientAddress = await testEnv.signers[1].getAddress();
    
    console.log(`Token address: ${tokenAddress}`);
    console.log(`Owner address: ${ownerAddress}`);
    console.log(`Recipient address: ${recipientAddress}`);
  }, 30000);

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

      // Initial balance should not be 0
      expect(parseFloat(balance)).toBeGreaterThan(0);
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
      const amount = '10.0';
      
      const initialOwnerBalance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        ownerAddress
      );
      
      const initialRecipientBalance = await erc20.getBalance(
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

      const finalOwnerBalance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        ownerAddress
      );
      
      const finalRecipientBalance = await erc20.getBalance(
        ethersService,
        tokenAddress,
        recipientAddress
      );
      
      // Owner balance should decrease
      expect(parseFloat(finalOwnerBalance)).toBeLessThan(parseFloat(initialOwnerBalance));
      
      // Recipient balance should increase
      const expectedRecipientBalance = parseFloat(initialRecipientBalance) + parseFloat(amount);
      expect(parseFloat(finalRecipientBalance)).toBeCloseTo(expectedRecipientBalance, 1);
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
      
      // Check current allowance - may not be zero if other tests have run
      const initialAllowance = await erc20.getAllowance(
        ethersService,
        tokenAddress,
        ownerAddress,
        spender
      );
      
      // Note: We don't expect initialAllowance to be 0 necessarily
      // as other tests might have set it, so we skip this check
      
      // Approve the allowance with a new value
      const newAmount = '750.0';
      await erc20.approve(
        ethersService,
        tokenAddress,
        spender,
        newAmount
      );
      
      // Check the new allowance
      const finalAllowance = await erc20.getAllowance(
        ethersService,
        tokenAddress,
        ownerAddress,
        spender
      );
      
      expect(finalAllowance).toBe(newAmount);
    });
  });
}); 