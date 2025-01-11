import { describe, expect, test, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { EthersService } from '../services/ethersService.js';
import { getHardhatTestProvider } from './utils/hardhatTestProvider.js';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';

describe('Write Methods Tests', () => {
  let ethersService: EthersService;
  let testEnv: TestEnvironment;
  let signer: ethers.Signer;
  let recipientAddress: string;
  let testToken: TestToken;

  beforeAll(async () => {
    testEnv = await getHardhatTestProvider();
    ethersService = new EthersService(testEnv.provider);
    [signer] = testEnv.signers;
    recipientAddress = await testEnv.signers[1].getAddress();
    testToken = await deployTestToken(signer);
  }, 30000); // Increase timeout to 30 seconds

  describe('sendTransaction', () => {
    test('should send ETH between accounts', async () => {
      const initialBalance = await testEnv.provider.getBalance(recipientAddress);
      const amount = '1.0';

      const tx = await ethersService.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount)
      });
      await tx.wait();

      const newBalance = await testEnv.provider.getBalance(recipientAddress);
      const expectedBalance = initialBalance + ethers.parseEther(amount);
      const tolerance = ethers.parseEther("0.0001"); // Allow for small differences due to gas costs
      expect(newBalance).toBeGreaterThan(expectedBalance - tolerance);
      expect(newBalance).toBeLessThan(expectedBalance + tolerance);
    });

    test('should fail when sending more ETH than available balance', async () => {
      const signerBalance = await testEnv.provider.getBalance(await signer.getAddress());
      const tooMuch = ethers.formatEther(signerBalance + ethers.parseEther("1.0"));

      await expect(ethersService.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(tooMuch)
      })).rejects.toThrow();
    });

    test('should fail when sending to an invalid address', async () => {
      await expect(ethersService.sendTransaction({
        to: 'invalid-address',
        value: ethers.parseEther('1.0')
      })).rejects.toThrow();
    });
  });

  describe('signMessage', () => {
    test('should sign a message correctly', async () => {
      const message = 'Hello, World!';
      const signature = await ethersService.signMessage(message);
      expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
    });

    test('should sign different messages with different signatures', async () => {
      const message1 = 'Hello, World!';
      const message2 = 'Different message';
      const signature1 = await ethersService.signMessage(message1);
      const signature2 = await ethersService.signMessage(message2);
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('Contract Interactions', () => {
    test('should call contract method successfully', async () => {
      const tokenAddress = await testToken.getAddress();
      const amount = ethers.parseEther('10');
      const initialBalance = await testToken.balanceOf(recipientAddress);

      const data = testToken.interface.encodeFunctionData('transfer', [recipientAddress, amount]);
      const tx = await ethersService.sendTransaction({
        to: tokenAddress,
        data: data
      });
      await tx.wait();

      const newBalance = await testToken.balanceOf(recipientAddress);
      expect(newBalance).toBe(initialBalance + amount);
    });

    test('should fail when calling with insufficient balance', async () => {
      const tokenAddress = await testToken.getAddress();
      const signerBalance = await testToken.balanceOf(await signer.getAddress());
      const tooMuch = signerBalance + 1n;

      const data = testToken.interface.encodeFunctionData('transfer', [recipientAddress, tooMuch]);
      await expect(ethersService.sendTransaction({
        to: tokenAddress,
        data: data
      })).rejects.toThrow();
    });
  });
}); 