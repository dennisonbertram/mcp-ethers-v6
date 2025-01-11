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
      const tx = await alice.sendTransaction({
        to: bobAddress,
        value: ethers.parseEther("1.0")
      });

      // Wait for the transaction to be mined and get the receipt
      const receipt = await tx.wait();
      
      // Calculate expected balance (1 ETH = 1000000000000000000 wei)
      const expectedBalance = initialBalance + ethers.parseEther("1.0");
      
      // Check new balance
      const newBalance = await provider.getBalance(bobAddress);
      expect(newBalance).toBe(expectedBalance);
    });
  });

  // Add more write method tests here
}); 