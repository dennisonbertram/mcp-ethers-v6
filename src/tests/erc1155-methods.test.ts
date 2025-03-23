import { describe, expect, it, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import * as erc1155 from '../services/erc/erc1155.js';
import { EthersService } from '../services/ethersService.js';

// Import a simple ERC1155 contract for testing
import { SimpleERC1155Contract } from './contracts/SimpleERC1155Contract.js';

describe('ERC1155 Service Methods', () => {
  let testEnv: TestEnvironment;
  let ethersService: EthersService;
  let erc1155Contract: ethers.Contract;
  let contractAddress: string;
  let ownerAddress: string;
  let recipientAddress: string;
  const tokenId = 1;
  const batchTokenIds = [1, 2, 3];

  beforeAll(async () => {
    // No mocks needed - using real contracts on a test chain
    testEnv = await getTestEnvironment();
    const signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    
    // Deploy an ERC1155 contract
    const factory = new ethers.ContractFactory(
      SimpleERC1155Contract.abi,
      SimpleERC1155Contract.bytecode,
      signer
    );
    
    erc1155Contract = await factory.deploy("TestERC1155", "https://example.com/metadata/");
    contractAddress = await erc1155Contract.getAddress();
    
    ownerAddress = await signer.getAddress();
    recipientAddress = await testEnv.signers[1].getAddress();
    
    // Mint some tokens to owner
    await erc1155Contract.mint(ownerAddress, tokenId, 100, "0x");
    
    // Mint batch of tokens
    await erc1155Contract.mintBatch(
      ownerAddress,
      batchTokenIds,
      [100, 200, 300],
      "0x"
    );
    
    // Set a token URI for testing
    await erc1155Contract.setTokenURI(tokenId, "https://example.com/token/1");
  }, 30000);

  describe('Token Balance', () => {
    it('should get balance of a token', async () => {
      const balance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        ownerAddress,
        tokenId
      );

      expect(balance).toBe('100');
    });

    it('should get batch balances of tokens', async () => {
      const balances = await erc1155.balanceOfBatch(
        ethersService,
        contractAddress,
        [ownerAddress, ownerAddress, ownerAddress],
        batchTokenIds
      );

      expect(balances).toEqual(['100', '200', '300']);
    });

    it('should handle zero balance for a valid address', async () => {
      const randomWallet = ethers.Wallet.createRandom();
      const randomAddress = await randomWallet.getAddress();
      
      const balance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        randomAddress,
        tokenId
      );

      expect(balance).toBe('0');
    });
  });

  describe('Metadata', () => {
    it('should get token URI', async () => {
      const uri = await erc1155.getURI(
        ethersService,
        contractAddress,
        tokenId
      );

      expect(uri).toBe('https://example.com/token/1');
    });
  });

  describe('Approvals', () => {
    it('should check approval for all status', async () => {
      const isApproved = await erc1155.isApprovedForAll(
        ethersService,
        contractAddress,
        ownerAddress,
        recipientAddress
      );

      expect(isApproved).toBe(false);
    });

    it('should set approval for all', async () => {
      await erc1155.setApprovalForAll(
        ethersService,
        contractAddress,
        recipientAddress,
        true
      );

      const isApproved = await erc1155.isApprovedForAll(
        ethersService,
        contractAddress,
        ownerAddress,
        recipientAddress
      );

      expect(isApproved).toBe(true);
    });
  });

  describe('Transfers', () => {
    it('should transfer a token', async () => {
      // First check initial balances
      const initialOwnerBalance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        ownerAddress,
        tokenId
      );
      
      const initialRecipientBalance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        recipientAddress,
        tokenId
      );
      
      // Transfer 10 tokens
      await erc1155.safeTransferFrom(
        ethersService,
        contractAddress,
        ownerAddress,
        recipientAddress,
        tokenId,
        '10'
      );
      
      // Check final balances
      const finalOwnerBalance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        ownerAddress,
        tokenId
      );
      
      const finalRecipientBalance = await erc1155.balanceOf(
        ethersService,
        contractAddress,
        recipientAddress,
        tokenId
      );
      
      expect(finalOwnerBalance).toBe((parseInt(initialOwnerBalance) - 10).toString());
      expect(finalRecipientBalance).toBe((parseInt(initialRecipientBalance) + 10).toString());
    });
  });
}); 