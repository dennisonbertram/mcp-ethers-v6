/**
 * @file ERC1155 Helper Tests
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService';
import * as erc1155 from './erc1155';
import { ERC1155Error, UnauthorizedTokenActionError } from './errors';
import { balanceCache, contractCache, ensCache } from '../../utils/cache';

// Mock EthersService
jest.mock('../ethersService');

// Mock cache
jest.mock('../../utils/cache', () => ({
  balanceCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
  contractCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  ensCache: {
    get: jest.fn(),
    set: jest.fn(),
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
      name: 'Test Token',
      description: 'Test Description',
      image: 'https://example.com/image.png',
      attributes: [
        { trait_type: 'Background', value: 'Blue' },
      ],
    }),
  })
) as jest.Mock;

describe('ERC1155 Helpers', () => {
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
      balanceOf: jest.fn().mockResolvedValue(ethers.toBigInt(50)),
      balanceOfBatch: jest.fn().mockResolvedValue([
        ethers.toBigInt(50),
        ethers.toBigInt(100),
      ]),
      uri: jest.fn().mockResolvedValue('https://example.com/token/{id}'),
      isApprovedForAll: jest.fn().mockResolvedValue(false),
      setApprovalForAll: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      safeTransferFrom: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      safeBatchTransferFrom: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      supportsInterface: jest.fn().mockImplementation((interfaceId) => {
        return Promise.resolve(interfaceId === '0xd9b67a26'); // True for ERC1155
      }),
      filters: {
        TransferSingle: jest.fn().mockReturnValue({ address: TEST_CONTRACT_ADDRESS }),
        TransferBatch: jest.fn().mockReturnValue({ address: TEST_CONTRACT_ADDRESS }),
      },
      queryFilter: jest.fn().mockImplementation((filter) => {
        if (filter.address === TEST_CONTRACT_ADDRESS) {
          if (filter === mockContract.filters.TransferSingle()) {
            return Promise.resolve([
              { args: [null, null, TEST_OWNER_ADDRESS, ethers.toBigInt(123), ethers.toBigInt(1)] },
              { args: [null, null, TEST_OWNER_ADDRESS, ethers.toBigInt(456), ethers.toBigInt(10)] },
            ]);
          } else if (filter === mockContract.filters.TransferBatch()) {
            return Promise.resolve([
              {
                args: [
                  null,
                  null,
                  TEST_OWNER_ADDRESS,
                  [ethers.toBigInt(789), ethers.toBigInt(101)],
                  [ethers.toBigInt(5), ethers.toBigInt(2)]
                ]
              }
            ]);
          }
        }
        return Promise.resolve([]);
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
  
  describe('balanceOf', () => {
    it('should return balance from cache if available', async () => {
      const cachedBalance = '50';
      
      (balanceCache.get as jest.Mock).mockReturnValue(cachedBalance);
      
      const result = await erc1155.balanceOf(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual(cachedBalance);
      expect(balanceCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch balance from blockchain if not in cache', async () => {
      (balanceCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc1155.balanceOf(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual('50');
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(balanceCache.set).toHaveBeenCalled();
      expect(mockContract.balanceOf).toHaveBeenCalledWith(TEST_OWNER_ADDRESS, TEST_TOKEN_ID);
    });
  });
  
  describe('balanceOfBatch', () => {
    it('should fetch balances for multiple token IDs', async () => {
      const ownerAddresses = [TEST_OWNER_ADDRESS, TEST_OWNER_ADDRESS];
      const tokenIds = ['123', '456'];
      
      const result = await erc1155.balanceOfBatch(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        ownerAddresses,
        tokenIds
      );
      
      expect(result).toEqual(['50', '100']);
      expect(mockContract.balanceOfBatch).toHaveBeenCalledWith(ownerAddresses, tokenIds);
    });
    
    it('should throw error if arrays have different lengths', async () => {
      const ownerAddresses = [TEST_OWNER_ADDRESS, TEST_OWNER_ADDRESS];
      const tokenIds = ['123'];
      
      await expect(
        erc1155.balanceOfBatch(
          mockEthersService,
          TEST_CONTRACT_ADDRESS,
          ownerAddresses,
          tokenIds
        )
      ).rejects.toThrow(ERC1155Error);
    });
  });
  
  describe('getURI', () => {
    it('should return URI from cache if available', async () => {
      const cachedURI = 'https://cached.example.com/token/{id}';
      
      (ensCache.get as jest.Mock).mockReturnValue(cachedURI);
      
      const result = await erc1155.getURI(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual(cachedURI);
      expect(ensCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch URI from blockchain if not in cache', async () => {
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc1155.getURI(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual('https://example.com/token/{id}');
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(ensCache.set).toHaveBeenCalled();
      expect(mockContract.uri).toHaveBeenCalledWith(TEST_TOKEN_ID);
    });
  });
  
  describe('getMetadata', () => {
    it('should return metadata from cache if available', async () => {
      const cachedMetadata = {
        name: 'Cached Token',
        description: 'Cached Description',
      };
      
      (contractCache.get as jest.Mock).mockReturnValue(cachedMetadata);
      
      const result = await erc1155.getMetadata(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual(cachedMetadata);
      expect(contractCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch and parse metadata if not in cache', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      (ensCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc1155.getMetadata(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_TOKEN_ID
      );
      
      expect(result).toEqual({
        name: 'Test Token',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        attributes: [
          { trait_type: 'Background', value: 'Blue' },
        ],
      });
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(contractCache.set).toHaveBeenCalled();
      expect(mockContract.uri).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });
  });
  
  describe('safeTransferFrom', () => {
    it('should transfer tokens successfully when caller is owner', async () => {
      (balanceCache.get as jest.Mock).mockReturnValue('50');
      
      const result = await erc1155.safeTransferFrom(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        TEST_TOKEN_ID,
        '10'
      );
      
      expect(result).toEqual({ hash: '0xabcd', wait: expect.any(Function) });
      expect(mockContract.safeTransferFrom).toHaveBeenCalledWith(
        TEST_OWNER_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        TEST_TOKEN_ID,
        '10',
        '0x',
        {}
      );
      expect(balanceCache.delete).toHaveBeenCalledTimes(2);
    });
    
    it('should throw UnauthorizedTokenActionError if caller is not owner or approved', async () => {
      (balanceCache.get as jest.Mock).mockReturnValue('50');
      
      // Set a different sender than the signer
      const differentSender = '0x0123456789012345678901234567890123456789';
      
      await expect(
        erc1155.safeTransferFrom(
          mockEthersService,
          TEST_CONTRACT_ADDRESS,
          differentSender, // Not the signer
          TEST_RECIPIENT_ADDRESS,
          TEST_TOKEN_ID,
          '10'
        )
      ).rejects.toThrow(UnauthorizedTokenActionError);
    });
    
    it('should throw error if balance is insufficient', async () => {
      (balanceCache.get as jest.Mock).mockReturnValue('5');
      
      await expect(
        erc1155.safeTransferFrom(
          mockEthersService,
          TEST_CONTRACT_ADDRESS,
          TEST_OWNER_ADDRESS,
          TEST_RECIPIENT_ADDRESS,
          TEST_TOKEN_ID,
          '10'
        )
      ).rejects.toThrow(ERC1155Error);
    });
  });
  
  describe('getUserTokens', () => {
    it('should get tokens for specified token IDs', async () => {
      const mockTokenIds = ['123', '456', '789'];
      
      // Mock balanceOf to return different values for different tokens
      mockContract.balanceOf.mockImplementation((owner, tokenId) => {
        if (tokenId === '123') return ethers.toBigInt(5);
        if (tokenId === '456') return ethers.toBigInt(10);
        if (tokenId === '789') return ethers.toBigInt(0); // Zero balance
        return ethers.toBigInt(0);
      });
      
      const result = await erc1155.getUserTokens(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS,
        mockTokenIds
      );
      
      // Should only include tokens with non-zero balance
      expect(result.length).toBe(2);
      expect(result[0].tokenId).toBe('123');
      expect(result[0].balance).toBe('5');
      expect(result[1].tokenId).toBe('456');
      expect(result[1].balance).toBe('10');
    });
    
    it('should discover tokens from events if no token IDs provided', async () => {
      // For TokenIds 123, 456, 789, 101
      mockContract.balanceOf.mockImplementation((owner, tokenId) => {
        if (tokenId === '123') return ethers.toBigInt(1);
        if (tokenId === '456') return ethers.toBigInt(10);
        if (tokenId === '789') return ethers.toBigInt(5);
        if (tokenId === '101') return ethers.toBigInt(2);
        return ethers.toBigInt(0);
      });
      
      const result = await erc1155.getUserTokens(
        mockEthersService,
        TEST_CONTRACT_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      // Should include all tokens with non-zero balance from events
      expect(result.length).toBe(4);
      
      // Token IDs might come in different order, so check they are all included
      const tokenIds = result.map(token => token.tokenId);
      expect(tokenIds).toContain('123');
      expect(tokenIds).toContain('456');
      expect(tokenIds).toContain('789');
      expect(tokenIds).toContain('101');
      
      // Check balances
      const tokenIdToBalance = new Map(result.map(token => [token.tokenId, token.balance]));
      expect(tokenIdToBalance.get('123')).toBe('1');
      expect(tokenIdToBalance.get('456')).toBe('10');
      expect(tokenIdToBalance.get('789')).toBe('5');
      expect(tokenIdToBalance.get('101')).toBe('2');
    });
  });
}); 