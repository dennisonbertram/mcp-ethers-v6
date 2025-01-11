import { describe, expect, test, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { EthersService } from '../services/ethersService.js';
import { getHardhatTestProvider } from './utils/hardhatTestProvider.js';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { deployTestToken, TestToken } from './utils/testContractHelper.js';

describe('Contract Methods Tests', () => {
  let ethersService: EthersService;
  let testEnv: TestEnvironment;
  let alice: ethers.Signer;
  let bob: ethers.Signer;
  let testToken: TestToken;
  let aliceAddress: string;
  let bobAddress: string;
  const approvalAmount = 1000n;

  beforeAll(async () => {
    testEnv = await getHardhatTestProvider();
    ethersService = new EthersService(testEnv.provider);
    [alice, bob] = testEnv.signers;
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    testToken = await deployTestToken(alice);
  }, 30000); // Increase timeout to 30 seconds

  describe('Contract Read Methods', () => {
    test('should get token name', async () => {
      const name = await testToken.name();
      expect(name).toBe('MyToken');
    });

    test('should get token symbol', async () => {
      const symbol = await testToken.symbol();
      expect(symbol).toBe('MCP');
    });

    test('should get token decimals', async () => {
      const decimals = await testToken.decimals();
      expect(decimals).toBe(18);
    });

    test('should get token balance', async () => {
      const balance = await testToken.balanceOf(aliceAddress);
      expect(balance).toBe(ethers.parseEther('1000000'));
    });
  });

  describe('Contract Write Methods', () => {
    test('should transfer tokens between accounts', async () => {
      const initialAliceBalance = await testToken.balanceOf(aliceAddress);
      const initialBobBalance = await testToken.balanceOf(bobAddress);

      const transferAmount = ethers.parseEther('50');
      const transferTx = await testToken.transfer(bobAddress, transferAmount);
      await transferTx.wait();

      const newAliceBalance = await testToken.balanceOf(aliceAddress);
      const bobBalance = await testToken.balanceOf(bobAddress);

      expect(newAliceBalance).toBe(initialAliceBalance - transferAmount);
      expect(bobBalance).toBe(initialBobBalance + transferAmount);
    });

    test('should handle approval and transferFrom', async () => {
      const initialAliceBalance = await testToken.balanceOf(aliceAddress);
      const initialBobBalance = await testToken.balanceOf(bobAddress);

      const approvalAmount = ethers.parseEther('30');
      const approveTx = await testToken.approve(bobAddress, approvalAmount);
      await approveTx.wait();

      const allowance = await testToken.allowance(aliceAddress, bobAddress);
      expect(allowance).toBe(approvalAmount);

      const transferAmount = ethers.parseEther('20');
      const bobToken = testToken.connect(bob);
      const transferTx = await bobToken.transferFrom(aliceAddress, bobAddress, transferAmount);
      await transferTx.wait();

      const aliceBalance = await testToken.balanceOf(aliceAddress);
      const bobBalance = await testToken.balanceOf(bobAddress);
      const newAllowance = await testToken.allowance(aliceAddress, bobAddress);

      expect(aliceBalance).toBe(initialAliceBalance - transferAmount);
      expect(bobBalance).toBe(initialBobBalance + transferAmount);
      expect(newAllowance).toBe(approvalAmount - transferAmount);
    });

    test('should fail when transferring more than balance', async () => {
      const balance = await testToken.balanceOf(aliceAddress);
      const transferAmount = balance + 1n;

      await expect(testToken.transfer(bobAddress, transferAmount))
        .rejects
        .toThrow('insufficient balance');
    });

    test('should fail when transferring more than allowance', async () => {
      await testToken.approve(bobAddress, approvalAmount);

      const transferAmount = approvalAmount + 1n;
      const bobToken = testToken.connect(bob);

      await expect(bobToken.transferFrom(aliceAddress, bobAddress, transferAmount))
        .rejects
        .toThrow('exceeds allowance');
    });
  });
}); 