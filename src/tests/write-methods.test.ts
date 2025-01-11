import { describe, expect, test, beforeAll, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { EthersService } from '../services/ethersService.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';

describe('Write Methods Tests', () => {
  let ethersService: EthersService;
  let testEnv: TestEnvironment;
  let signer: ethers.Signer;
  let recipientAddress: string;
  let testToken: TestToken;

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
    signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    recipientAddress = await testEnv.signers[1].getAddress();
    testToken = await deployTestToken(testEnv.provider, signer);

    // Fund the signer with some ETH
    const funder = testEnv.signers[2];
    const funderAddress = await funder.getAddress();
    const signerAddress = await signer.getAddress();
    console.log('Funder address:', funderAddress);
    console.log('Funder balance:', ethers.formatEther(await testEnv.provider.getBalance(funderAddress)));

    const fundAmount = ethers.parseEther('10.0');
    const tx = await funder.sendTransaction({
      to: signerAddress,
      value: fundAmount
    });
    await tx.wait();

    console.log('After funding signer balance:', ethers.formatEther(await testEnv.provider.getBalance(signerAddress)));
  }, 30000);

  beforeEach(async () => {
    // Check balance before each test
    const signerAddress = await signer.getAddress();
    console.log('Before test signer balance:', ethers.formatEther(await testEnv.provider.getBalance(signerAddress)));
  });

  describe('sendTransaction', () => {
    test('should send ETH between accounts', async () => {
      const signerAddress = await signer.getAddress();
      const initialBalance = await testEnv.provider.getBalance(recipientAddress);
      const signerBalance = await testEnv.provider.getBalance(signerAddress);
      console.log('Recipient initial balance:', ethers.formatEther(initialBalance));
      console.log('Signer balance before send:', ethers.formatEther(signerBalance));

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
      const signerAddress = await signer.getAddress();
      const signerBalance = await testEnv.provider.getBalance(signerAddress);
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
    test('should sign a message', async () => {
      const message = 'Hello, World!';
      const signature = await ethersService.signMessage(message);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(132); // 0x + 130 hex characters
    });
  });
}); 