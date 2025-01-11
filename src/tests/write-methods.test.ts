import { EthersService } from '../services/ethersService.js';
import { getHardhatTestProvider, TEST_ACCOUNTS } from './utils/hardhatTestProvider.js';
import { ethers } from 'ethers';

describe('EthersService Write Methods', () => {
  let ethersService: EthersService;
  let provider: ethers.Provider;
  let accounts: ethers.Signer[];
  let defaultSigner: ethers.Signer;

  beforeAll(async () => {
    // Get our test provider and accounts
    const testEnv = await getHardhatTestProvider();
    provider = testEnv.provider;
    accounts = testEnv.accounts;
    defaultSigner = testEnv.defaultSigner;
  });

  beforeEach(() => {
    ethersService = new EthersService();
  });

  describe('sendTransaction', () => {
    it('should send ETH between accounts', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const bob = accounts[TEST_ACCOUNTS.BOB];
      
      // Get initial balances
      const aliceAddress = await alice.getAddress();
      const bobAddress = await bob.getAddress();
      const initialBalance = await provider.getBalance(bobAddress);
      
      // Send 1 ETH
      const amount = ethers.parseEther("1.0");
      const tx = await alice.sendTransaction({
        to: bobAddress,
        value: amount,
        gasPrice: 1000000000 // 1 gwei
      });

      // Wait for the transaction to be mined and get the receipt
      const receipt = await tx.wait();
      expect(receipt).not.toBeNull();
      
      // Check new balance
      const newBalance = await provider.getBalance(bobAddress);
      expect(newBalance.toString()).toBe((initialBalance + amount).toString());
    });

    it('should fail when sending more ETH than available balance', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const bob = accounts[TEST_ACCOUNTS.BOB];
      const bobAddress = await bob.getAddress();
      const aliceBalance = await provider.getBalance(await alice.getAddress());
      
      // Try to send more ETH than the account has
      await expect(
        alice.sendTransaction({
          to: bobAddress,
          value: aliceBalance + ethers.parseEther("1.0"),
          gasPrice: 1000000000
        })
      ).rejects.toThrow(/sender doesn't have enough funds/i);
    });

    it('should fail when sending to an invalid address', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const invalidAddress = "0x1234"; // Too short to be valid
      
      expect(() => {
        ethers.getAddress(invalidAddress);
      }).toThrow(/invalid address/i);
    });

    it('should send transaction with custom data', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const bob = accounts[TEST_ACCOUNTS.BOB];
      const bobAddress = await bob.getAddress();
      
      // Send transaction with custom data
      const customData = "0x1234567890";
      const tx = await alice.sendTransaction({
        to: bobAddress,
        value: ethers.parseEther("1.0"),
        data: customData,
        gasPrice: 1000000000
      });

      const receipt = await tx.wait();
      expect(receipt).not.toBeNull();
      if (receipt) {
        expect(receipt.status).toBe(1); // Success
      }
    });

    it('should estimate gas correctly for a transfer', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const bob = accounts[TEST_ACCOUNTS.BOB];
      const bobAddress = await bob.getAddress();
      
      // Estimate gas for the transfer
      const gasEstimate = await provider.estimateGas({
        from: await alice.getAddress(),
        to: bobAddress,
        value: ethers.parseEther("1.0"),
        gasPrice: 1000000000
      });

      // Standard ETH transfer should use exactly 21001 gas in Hardhat
      expect(gasEstimate.toString()).toBe("21001");
    });

    it('should handle zero value transfers', async () => {
      const alice = accounts[TEST_ACCOUNTS.ALICE];
      const bob = accounts[TEST_ACCOUNTS.BOB];
      const bobAddress = await bob.getAddress();
      
      // Get initial balance
      const initialBalance = await provider.getBalance(bobAddress);
      
      // Get current nonce
      const nonce = await provider.getTransactionCount(await alice.getAddress());
      
      // Send 0 ETH
      const tx = await alice.sendTransaction({
        to: bobAddress,
        value: 0n,
        gasPrice: 1000000000,
        nonce: nonce
      });

      const receipt = await tx.wait();
      expect(receipt).not.toBeNull();
      
      // Balance should remain unchanged (ignoring gas costs)
      const newBalance = await provider.getBalance(bobAddress);
      expect(BigInt(newBalance.toString()) - BigInt(initialBalance.toString())).toBe(0n);
    });
  });

  // Add more write method tests here
}); 