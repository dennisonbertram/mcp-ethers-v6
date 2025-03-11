/**
 * @file ERC20 Helper Tests
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService.js';
import * as erc20 from './erc20.js';
import { InsufficientBalanceError, TokenNotFoundError } from './errors.js';
import { balanceCache, contractCache } from '../../utils/cache.js';

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

describe('ERC20 Helpers', () => {
  let mockEthersService: jest.Mocked<EthersService>;
  let mockProvider: jest.Mocked<ethers.Provider>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let mockContract: jest.Mocked<ethers.Contract>;
  
  const TEST_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';
  const TEST_OWNER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const TEST_RECIPIENT_ADDRESS = '0x9876543210987654321098765432109876543210';
  
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
      name: jest.fn().mockResolvedValue('Test Token'),
      symbol: jest.fn().mockResolvedValue('TEST'),
      decimals: jest.fn().mockResolvedValue(18),
      totalSupply: jest.fn().mockResolvedValue(ethers.parseEther('1000000')),
      balanceOf: jest.fn().mockResolvedValue(ethers.parseEther('100')),
      allowance: jest.fn().mockResolvedValue(ethers.parseEther('50')),
      transfer: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      approve: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
      transferFrom: jest.fn().mockResolvedValue({ hash: '0xabcd', wait: jest.fn() }),
    } as unknown as jest.Mocked<ethers.Contract>;
    
    // Create mock EthersService
    mockEthersService = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      getSigner: jest.fn().mockReturnValue(mockSigner),
    } as unknown as jest.Mocked<EthersService>;
    
    // Mock ethers.Contract constructor
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
  });
  
  describe('getTokenInfo', () => {
    it('should return token info from cache if available', async () => {
      const cachedInfo = {
        name: 'Cached Token',
        symbol: 'CACHE',
        decimals: 18,
        totalSupply: '1000000000000000000000000'
      };
      
      (contractCache.get as jest.Mock).mockReturnValue(cachedInfo);
      
      const result = await erc20.getTokenInfo(
        mockEthersService,
        TEST_TOKEN_ADDRESS
      );
      
      expect(result).toEqual(cachedInfo);
      expect(contractCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch token info from blockchain if not in cache', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      
      const result = await erc20.getTokenInfo(
        mockEthersService,
        TEST_TOKEN_ADDRESS
      );
      
      expect(result).toEqual({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000000000000000000000'
      });
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(contractCache.set).toHaveBeenCalled();
      expect(mockContract.name).toHaveBeenCalled();
      expect(mockContract.symbol).toHaveBeenCalled();
      expect(mockContract.decimals).toHaveBeenCalled();
      expect(mockContract.totalSupply).toHaveBeenCalled();
    });
    
    it('should throw TokenNotFoundError if contract does not exist', async () => {
      (contractCache.get as jest.Mock).mockReturnValue(null);
      mockProvider.getCode.mockResolvedValue('0x');
      
      await expect(
        erc20.getTokenInfo(mockEthersService, TEST_TOKEN_ADDRESS)
      ).rejects.toThrow(TokenNotFoundError);
    });
  });
  
  describe('getBalance', () => {
    it('should return balance from cache if available', async () => {
      const cachedBalance = '100.0';
      
      (balanceCache.get as jest.Mock).mockReturnValue(cachedBalance);
      
      const result = await erc20.getBalance(
        mockEthersService,
        TEST_TOKEN_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      expect(result).toEqual(cachedBalance);
      expect(balanceCache.get).toHaveBeenCalled();
      expect(mockEthersService.getProvider).not.toHaveBeenCalled();
    });
    
    it('should fetch balance from blockchain if not in cache', async () => {
      (balanceCache.get as jest.Mock).mockReturnValue(null);
      (contractCache.get as jest.Mock).mockReturnValue({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000000000000000000000'
      });
      
      const result = await erc20.getBalance(
        mockEthersService,
        TEST_TOKEN_ADDRESS,
        TEST_OWNER_ADDRESS
      );
      
      expect(result).toEqual('100.0');
      
      expect(mockEthersService.getProvider).toHaveBeenCalled();
      expect(balanceCache.set).toHaveBeenCalled();
      expect(mockContract.balanceOf).toHaveBeenCalledWith(TEST_OWNER_ADDRESS);
    });
  });
  
  describe('transfer', () => {
    it('should transfer tokens successfully', async () => {
      (contractCache.get as jest.Mock).mockReturnValue({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000000000000000000000'
      });
      
      const result = await erc20.transfer(
        mockEthersService,
        TEST_TOKEN_ADDRESS,
        TEST_RECIPIENT_ADDRESS,
        '10'
      );
      
      expect(result).toEqual({ hash: '0xabcd', wait: expect.any(Function) });
      expect(mockContract.transfer).toHaveBeenCalledWith(
        TEST_RECIPIENT_ADDRESS,
        ethers.parseEther('10'),
        {}
      );
      expect(balanceCache.delete).toHaveBeenCalledTimes(2);
    });
    
    it('should throw InsufficientBalanceError if balance is too low', async () => {
      (contractCache.get as jest.Mock).mockReturnValue({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000000000000000000000'
      });
      
      mockContract.balanceOf.mockResolvedValue(ethers.parseEther('5'));
      
      await expect(
        erc20.transfer(
          mockEthersService,
          TEST_TOKEN_ADDRESS,
          TEST_RECIPIENT_ADDRESS,
          '10'
        )
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });
}); 