/**
 * @file ERC721 Helper Tests
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService';
import * as erc721 from './erc721';
import { TokenNotFoundError, UnauthorizedTokenActionError } from './errors';
import { contractCache, ensCache } from '../../utils/cache';

// Mock EthersService
jest.mock('../ethersService');

// Mock cache
jest.mock('../../utils/cache', () => ({
  contractCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  ensCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock metrics and logger
jest.mock('../../utils/metrics', () => ({
  metrics: {
    incrementCounter: jest.fn(),
  },
  timeAsync: jest.fn((name, fn) => fn()),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

// Mock rate limiter
jest.mock('../../utils/rateLimiter', () => ({
  rateLimiter: {
    consume: jest.fn().mockReturnValue(true),
  },
}));

// Mock fetch for metadata
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      name: 'Test NFT',
      description: 'Test Description',
      image: 'https://example.com/image.png',
      attributes: [
        { trait_type: 'Background', value: 'Blue' },
      ],
    }),
  })
) as jest.Mock;

describe('ERC721 Helpers', () => {
  let mockEthersService: jest.Mocked<EthersService>;
  let mockProvider: jest.Mocked<ethers.Provider>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let mockContract: jest.Mocked<ethers.Contract>;
  
  const TEST_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
  const TEST_OWNER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const TEST_RECIPIENT_ADDRESS = '0x9876543210987654321098765432109876543210';
  const TEST_TOKEN_ID = '123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock provider
    mockProvider = {
      getCode: jest.fn().mockResolvedValue('0x123'),
    } as unknown as jest.Mocked<ethers.Provider>;
    
    // Create mock signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue(TEST_OWNER_ADDRESS),
    } as unknown as jest.Mocked<ethers.Signer>;
    
    // Create mock contract
    mockContract = {
      name: jest.fn().mockResolvedValue('Test Collection'),
      symbol: jest.fn().mockResolvedValue('TEST'),
      totalSupply: jest.fn().mockResolvedValue(ethers.toBigInt(1000)),
      balanceOf: jest.fn().mockResolvedValue(ethers.toBigInt(5)),
      ownerOf: jest.fn().mockResolvedValue(TEST_OWNER_ADDRESS),
      tokenURI: jest.fn().mockResolvedValue('https://example.com/token/123'),
      getApproved: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000'),
      isApprovedForAll: jest.fn().mockResolvedValue(false),
      supportsInterface: jest.fn().mockImplementation((interfaceId) => {
        return Promise.resolve(interfaceId === '0x80ac58cd'); // True for ERC721
      }),
      approve: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      setApprovalForAll: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      transferFrom: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      safeTransferFrom: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      filters: {
        Transfer: jest.fn().mockReturnValue({ address: TEST_CONTRACT_ADDRESS }),
      },
      queryFilter: jest.fn().mockResolvedValue([
        { args: [null, TEST_OWNER_ADDRESS, ethers.toBigInt(123)] },
        { args: [null, TEST_OWNER_ADDRESS, ethers.toBigInt(456)] },
      ]),
      tokenOfOwnerByIndex: jest.fn().mockImplementation((owner, index) => {
        return Promise.resolve(ethers.toBigInt(100 + Number(index)));
      }),
    } as unknown as jest.Mocked<ethers.Contract>;
    
    // Create mock EthersService
    mockEthersService = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      getSigner: jest.fn().mockReturnValue(mockSigner),
    } as unknown as jest.Mocked<EthersService>;
    
    // Mock ethers.Contract constructor
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
  });
  
  describe('getNFTInfo', () => {
    it('should return NFT info from cache if available', async () => {
      const cachedInfo = {
        name: 'Cached Collection',
        symbol: 'CACHE',
        totalSupply: '1000'
      };
      
      (contractCache.get as jest.Mock).mockReturnValue(cachedInfo);
      
      const result = await erc721.getNFTInfo(
        mockEthersService,
        TEST_CONTRACT_ADDRESS
      );
      
      expect(result).toEqual(cachedInfo);
      expect(contractCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch NFT info from blockchain if not in cache', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc721.getNFTInfo(
        mockEthersService,
        TEST_CONTRACT_ADDRESS
      );
      
      expect(result).toEqual({
        name: 'Test Collection',
        symbol: 'TEST',
        totalSupply: '1000'
      });
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(contractCache.set).toHaveBeenCalled();
      expect(mockContract.name).toHaveBeenCalled();
      expect(mockContract.symbol).toHaveBeenCalled();
      expect(mockContract.totalSupply).toHaveBeenCalled();
    });
    
    it('should throw TokenNotFoundError if contract does not exist', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      mockProvider.getCode.mockResolvedValue('0x');
      
      await expect(
        erc721.getNFTInfo(mockEthersService, TEST_CONTRACT_ADDRESS)
      ).rejects.toThrow(TokenNotFoundError);
    });
    
    it('should handle missing name and symbol', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      
      mockContract.name.mockRejectedValue(new Error('Function not implemented'));
      mockContract.symbol.mockRejectedValue(new Error('Function not implemented'));
      
      const result = await erc721.getNFTInfo(
        mockEthersService,
        TEST_CONTRACT_ADDRESS
      );
      
      expect(result).toEqual({
        name: 'Unknown Collection',
        symbol: 'NFT',
        totalSupply: '1000'
      });
    });
  });
  
  describe('ownerOf', () => {
    it('should return owner from cache if available', async () => {
      const cachedOwner = TEST_OWNER_ADDRESS;
      
      (ensCache.get as jest.Mock).mockReturnValue(cachedOwner);
      
      const result = await erc721.ownerOf(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual(cachedOwner);
      expect(ensCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch owner from blockchain if not in cache', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc721.ownerOf(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual(TEST_OWNER_ADDRESS);
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(ensCache.set).toHaveBeenCalled();
      expect(mockContract.ownerOf).toHaveBeenCalledWith(TEST_TOKEN_ID);
    });
    
    it('should throw TokenNotFoundError if token does not exist', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      mockContract.ownerOf.mockRejectedValue(new Error('owner query for nonexistent token'));
      
      await expect(
        erc721.ownerOf(mockEthersService, TEST_CONTRACT_ADDRESS, TEST_TOKEN_ID)
      ).rejects.toThrow(TokenNotFoundError);
    });
  });
  
  describe('transferNFT', () => {
    it('should transfer NFT successfully when caller is owner', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc721.transferNFT(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual({ hash: '0xabcd', wait: expect.any(Function) });
      expect(mockContract.transferFrom).toHaveBeenCalledWith(
        TEST_OWNER_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        TEST_TOKEN_ID,
        {}
      );
      expect(ensCache.delete).toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedTokenActionError if caller is not owner or approved', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      // Set a different owner than the signer
      mockContract.ownerOf.mockResolvedValue(TEST_RECIPIENT_ADDRESS);
      
      await expect(
        erc721.transferNFT(
          mockEthersService,
          TEST_CONTRACT_ADDRESS,
          TEST_RECIPIENT_ADDRESS,
          TEST_TOKEN_ID
        )
      ).rejects.toThrow(UnauthorizedTokenActionError);
    });
    
    it('should transfer NFT if caller is approved for the token', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      // Set a different owner than the signer
      mockContract.ownerOf.mockResolvedValue(TEST_RECIPIENT_ADDRESS);
      
      // But make the signer approved for this token
      mockContract.getApproved.mockResolvedValue(TEST_OWNER_ADDRESS);
      
      const result = await erc721.transferNFT(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual({ hash: '0xabcd', wait: expect.any(Function) });
      expect(mockContract.transferFrom).toHaveBeenCalled();
    });
  });
  
  describe('getUserNFTs', () => {
    it('should return empty array if user has no NFTs', async () => {
      mockContract.balanceOf.mockResolvedValue(ethers.toBigInt(0));
      
      const result = await erc721.getUserNFTs(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      expect(result).toEqual([]);
    });
    
    it('should use tokenOfOwnerByIndex for enumerable collections', async () => {
      mockContract.supportsInterface.mockImplementation((interfaceId) => {
        return Promise.resolve(interfaceId === '0x780e9d63'); // True for ERC721Enumerable
      });
      
      const result = await erc721.getUserNFTs(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      expect(result.length).toBe(5); // Based on balanceOf returning 5
      expect(result[0].tokenId).toBe('100');
      expect(mockContract.tokenOfOwnerByIndex).toHaveBeenCalled();
      expect(mockContract.queryFilter).not.toHaveBeenCalled();
    });
    
    it('should use events for non-enumerable collections', async () => {
      // Make supportsInterface return false for enumerable
      mockContract.supportsInterface.mockImplementation((interfaceId) => {
        return Promise.resolve(interfaceId !== '0x780e9d63');
      });
      
      // Make tokenOfOwnerByIndex fail
      mockContract.tokenOfOwnerByIndex.mockRejectedValue(new Error('not implemented'));
      
      const result = await erc721.getUserNFTs(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      expect(mockContract.queryFilter).toHaveBeenCalled();
      expect(result.length).toBe(2); // Based on mock events
    });
    
    it('should fetch metadata if includeMetadata is true', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      
      mockContract.balanceOf.mockResolvedValue(ethers.toBigInt(1));
      mockContract.tokenOfOwnerByIndex.mockResolvedValue(ethers.toBigInt(123));
      
      const result = await erc721.getUserNFTs(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS,
        true // includeMetadata
      );
      
      expect(result.length).toBe(1);
      expect(result[0].tokenId).toBe('123');
      expect(result[0].metadata).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });
  });
}); 