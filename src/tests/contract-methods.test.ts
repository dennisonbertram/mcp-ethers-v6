import { ethers } from 'ethers';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';

describe('Contract Methods', () => {
  let testEnv: TestEnvironment;
  let testToken: TestToken;

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
    testToken = await deployTestToken(testEnv.provider, testEnv.signers[0]);
  });

  describe('ERC20 Token', () => {
    it('should return correct token name', async () => {
      const name = await testToken.name();
      expect(name).toBe('MyToken');
    });

    it('should return correct token symbol', async () => {
      const symbol = await testToken.symbol();
      expect(symbol).toBe('MCP');
    });

    it('should return correct token decimals', async () => {
      const decimals = await testToken.decimals();
      expect(Number(decimals)).toBe(18);
    });

    it('should return correct balance for valid address', async () => {
      const owner = testEnv.signers[0];
      const ownerAddress = await owner.getAddress();
      const balance = await testToken.balanceOf(ownerAddress);
      expect(balance.toString()).toBe(ethers.parseEther('1000000').toString());
    });

    it('should handle token transfers correctly', async () => {
      const sender = testEnv.signers[0];
      const recipient = testEnv.signers[1];
      const recipientAddress = await recipient.getAddress();
      const amount = ethers.parseEther('100');

      const initialBalance = await testToken.balanceOf(recipientAddress);
      
      await testToken.transfer(recipientAddress, amount);

      const finalBalance = await testToken.balanceOf(recipientAddress);
      expect(finalBalance.toString()).toBe((initialBalance + amount).toString());
    });

    it('should fail when transferring to invalid address', async () => {
      const amount = ethers.parseEther('100');
      await expect(testToken.transfer('0x0000000000000000000000000000000000000000', amount))
        .rejects
        .toThrow();
    });

    it('should fail when transferring more than balance', async () => {
      const sender = testEnv.signers[0];
      const recipient = testEnv.signers[1];
      const recipientAddress = await recipient.getAddress();
      const amount = ethers.parseEther('2000000'); // More than total supply

      await expect(testToken.transfer(recipientAddress, amount))
        .rejects
        .toThrow();
    });
  });
}); 