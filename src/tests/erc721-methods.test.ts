import { describe, expect, it, beforeAll } from '@jest/globals';
import { ethers } from 'ethers';
import { TestEnvironment } from './utils/hardhatTestProvider.js';
import { getTestEnvironment } from './utils/globalTestSetup.js';
import * as erc721 from '../services/erc/erc721.js';
import { EthersService } from '../services/ethersService.js';

// Import a simple NFT contract for testing
import { SimpleNFTContract } from './contracts/SimpleNFTContract.js';

describe('ERC721 Service Methods', () => {
  let testEnv: TestEnvironment;
  let ethersService: EthersService;
  let nftContract: ethers.Contract;
  let nftAddress: string;
  let ownerAddress: string;
  let recipientAddress: string;
  let tokenId: number;

  beforeAll(async () => {
    // No mocks needed - we're working with real contracts on the test chain
    testEnv = await getTestEnvironment();
    const signer = testEnv.signers[0];
    ethersService = new EthersService(testEnv.provider, signer);
    
    // Deploy an NFT contract
    const factory = new ethers.ContractFactory(
      SimpleNFTContract.abi,
      SimpleNFTContract.bytecode,
      signer
    );
    
    nftContract = await factory.deploy("TestNFT", "TNFT");
    nftAddress = await nftContract.getAddress();
    
    ownerAddress = await signer.getAddress();
    recipientAddress = await testEnv.signers[1].getAddress();
    
    // Mint an NFT to the owner
    const tx = await nftContract.mint(ownerAddress, "https://example.com/token/1");
    const receipt = await tx.wait();
    
    // Get the token ID from the event
    const event = receipt?.logs[0];
    const parsedEvent = nftContract.interface.parseLog(event);
    tokenId = Number(parsedEvent?.args[2]);
  }, 30000);

  describe('NFT Info', () => {
    it('should get basic NFT collection info', async () => {
      const nftInfo = await erc721.getNFTInfo(
        ethersService,
        nftAddress
      );

      expect(nftInfo.name).toBe('TestNFT');
      expect(nftInfo.symbol).toBe('TNFT');
    });
  });

  describe('Token Ownership', () => {
    it('should get the owner of a token', async () => {
      const owner = await erc721.ownerOf(
        ethersService,
        nftAddress,
        tokenId
      );

      expect(owner.toLowerCase()).toBe(ownerAddress.toLowerCase());
    });

    it('should get token URI', async () => {
      const tokenURI = await erc721.getTokenURI(
        ethersService,
        nftAddress,
        tokenId
      );

      expect(tokenURI).toBe('https://example.com/token/1');
    });

    it('should get balance of an address', async () => {
      const balance = await erc721.balanceOf(
        ethersService,
        nftAddress,
        ownerAddress
      );

      // Convert BigInt to Number for comparison
      expect(Number(balance)).toBe(1);
    });
  });

  describe('Approvals', () => {
    it('should get approved address for token', async () => {
      const approvedAddress = await erc721.getApproved(
        ethersService,
        nftAddress,
        tokenId
      );

      // Initially no address is approved
      expect(approvedAddress).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should approve an address and get approval status', async () => {
      await erc721.approve(
        ethersService,
        nftAddress,
        recipientAddress,
        tokenId
      );

      const approvedAddress = await erc721.getApproved(
        ethersService,
        nftAddress,
        tokenId
      );

      expect(approvedAddress.toLowerCase()).toBe(recipientAddress.toLowerCase());
    });

    it('should check approval for all status', async () => {
      const isApproved = await erc721.isApprovedForAll(
        ethersService,
        nftAddress,
        ownerAddress,
        recipientAddress
      );

      // Initially it should be false
      expect(isApproved).toBe(false);
    });

    it('should set approval for all', async () => {
      await erc721.setApprovalForAll(
        ethersService,
        nftAddress,
        recipientAddress,
        true
      );

      const isApproved = await erc721.isApprovedForAll(
        ethersService,
        nftAddress,
        ownerAddress,
        recipientAddress
      );

      expect(isApproved).toBe(true);
    });
  });

  describe('Transfers', () => {
    it('should transfer NFT to another address', async () => {
      // Mint another NFT for transfer test
      const tx = await nftContract.mint(ownerAddress, "https://example.com/token/2");
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      const parsedEvent = nftContract.interface.parseLog(event);
      const transferTokenId = Number(parsedEvent?.args[2]);

      // Check owner before transfer
      const ownerBefore = await erc721.ownerOf(
        ethersService,
        nftAddress,
        transferTokenId
      );
      expect(ownerBefore.toLowerCase()).toBe(ownerAddress.toLowerCase());

      // Transfer the NFT
      await erc721.transferNFT(
        ethersService,
        nftAddress,
        recipientAddress,
        transferTokenId
      );

      // Check owner after transfer
      const ownerAfter = await erc721.ownerOf(
        ethersService,
        nftAddress,
        transferTokenId
      );
      expect(ownerAfter.toLowerCase()).toBe(recipientAddress.toLowerCase());
    });
  });
}); 