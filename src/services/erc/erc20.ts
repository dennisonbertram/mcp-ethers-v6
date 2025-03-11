/**
 * @file ERC20 Token Helpers
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Helper functions for interacting with ERC20 tokens
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService';
import { ERC20_ABI, CACHE_KEYS } from './constants';
import { ERC20Info, TokenOperationOptions } from './types';
import { 
  ERC20Error, 
  InsufficientAllowanceError, 
  InsufficientBalanceError,
  TokenNotFoundError, 
  handleTokenError 
} from './errors';
import { createTokenCacheKey } from './utils';
import { balanceCache, contractCache } from '../../utils/cache';
import { logger } from '../../utils/logger';
import { metrics, timeAsync } from '../../utils/metrics';
import { rateLimiter } from '../../utils/rateLimiter';

/**
 * Get basic information about an ERC20 token
 * 
 * @param tokenAddress Token contract address
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with token information
 */
export async function getTokenInfo(
  ethersService: EthersService,
  tokenAddress: string,
  provider?: string,
  chainId?: number
): Promise<ERC20Info> {
  metrics.incrementCounter('erc20.getTokenInfo');
  
  return timeAsync('erc20.getTokenInfo', async () => {
    try {
      // Check rate limiting
      const identity = `${tokenAddress}:${provider || 'default'}`;
      if (!rateLimiter.consume('token', identity)) {
        throw new ERC20Error('Rate limit exceeded for token operations');
      }
      
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_INFO,
        tokenAddress,
        chainId
      );
      
      // Check cache first
      const cachedInfo = contractCache.get(cacheKey);
      if (cachedInfo) {
        return cachedInfo as ERC20Info;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      
      // Fetch token information
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      // Format data
      const tokenInfo: ERC20Info = {
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString()
      };
      
      // Cache result for future use (1 day TTL)
      contractCache.set(cacheKey, tokenInfo, { ttl: 86400000 });
      
      return tokenInfo;
    } catch (error) {
      logger.debug('Error getting ERC20 token info', { tokenAddress, error });
      
      if (error instanceof Error && (
        error.message.includes('contract not deployed') || 
        error.message.includes('invalid address')
      )) {
        throw new TokenNotFoundError(tokenAddress);
      }
      
      throw handleTokenError(error, 'Failed to get token information');
    }
  });
}

/**
 * Get ERC20 token balance for an address
 * 
 * @param tokenAddress ERC20 token contract address
 * @param ownerAddress Address to check balance for
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with formatted balance as string
 */
export async function getBalance(
  ethersService: EthersService,
  tokenAddress: string,
  ownerAddress: string,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc20.getBalance');
  
  return timeAsync('erc20.getBalance', async () => {
    try {
      // Check rate limiting
      const identity = `${tokenAddress}:${ownerAddress}`;
      if (!rateLimiter.consume('token', identity)) {
        throw new ERC20Error('Rate limit exceeded for token operations');
      }
      
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_BALANCE,
        tokenAddress,
        ownerAddress,
        chainId
      );
      
      // Check cache first
      const cachedBalance = balanceCache.get(cacheKey);
      if (cachedBalance) {
        return cachedBalance;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      
      // Get raw balance
      const balance = await contract.balanceOf(ownerAddress);
      
      // Get token decimals for formatting
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Format the balance based on decimals
      const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals);
      
      // Cache result for future use (30 second TTL)
      balanceCache.set(cacheKey, formattedBalance, { ttl: 30000 });
      
      return formattedBalance;
    } catch (error) {
      logger.debug('Error getting ERC20 balance', { tokenAddress, ownerAddress, error });
      throw handleTokenError(error, 'Failed to get token balance');
    }
  });
}

/**
 * Get the allowance amount approved for a spender
 * 
 * @param tokenAddress ERC20 token contract address
 * @param ownerAddress Token owner address
 * @param spenderAddress Spender address
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with formatted allowance as string
 */
export async function getAllowance(
  ethersService: EthersService,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc20.getAllowance');
  
  return timeAsync('erc20.getAllowance', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_ALLOWANCE,
        tokenAddress,
        ownerAddress,
        spenderAddress,
        chainId
      );
      
      // Check cache first
      const cachedAllowance = balanceCache.get(cacheKey);
      if (cachedAllowance) {
        return cachedAllowance;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      
      // Get allowance
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      
      // Get token decimals for formatting
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Format the allowance based on decimals
      const formattedAllowance = ethers.formatUnits(allowance, tokenInfo.decimals);
      
      // Cache result for future use (30 second TTL)
      balanceCache.set(cacheKey, formattedAllowance, { ttl: 30000 });
      
      return formattedAllowance;
    } catch (error) {
      logger.debug('Error getting ERC20 allowance', { tokenAddress, ownerAddress, spenderAddress, error });
      throw handleTokenError(error, 'Failed to get token allowance');
    }
  });
}

/**
 * Transfer ERC20 tokens to a recipient
 * 
 * @param tokenAddress ERC20 token contract address
 * @param recipientAddress Recipient address
 * @param amount Amount to transfer in token units (e.g., "1.5" not wei)
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function transfer(
  ethersService: EthersService,
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc20.transfer');
  
  return timeAsync('erc20.transfer', async () => {
    try {
      // Check rate limiting for write operations
      const identity = `${tokenAddress}:transfer`;
      if (!rateLimiter.consume('transaction', identity)) {
        throw new ERC20Error('Rate limit exceeded for token transfers');
      }
      
      // Get provider and signer from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      const signer = ethersService['getSigner'](provider, chainId);
      
      // Get token info for decimals
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Parse input amount to wei equivalent based on token decimals
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      
      // Get current balance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      const walletAddress = await signer.getAddress();
      const balance = await contract.balanceOf(walletAddress);
      
      // Check if balance is sufficient
      if (balance < amountInWei) {
        throw new InsufficientBalanceError(
          tokenAddress,
          ethers.formatUnits(amountInWei, tokenInfo.decimals),
          ethers.formatUnits(balance, tokenInfo.decimals)
        );
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Send transaction
      const tx = await contractWithSigner.transfer(recipientAddress, amountInWei, overrides);
      
      // Invalidate balance caches
      const senderCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_BALANCE,
        tokenAddress,
        walletAddress,
        chainId
      );
      const recipientCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_BALANCE,
        tokenAddress,
        recipientAddress,
        chainId
      );
      balanceCache.delete(senderCacheKey);
      balanceCache.delete(recipientCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error transferring ERC20 tokens', { tokenAddress, recipientAddress, amount, error });
      throw handleTokenError(error, 'Failed to transfer tokens');
    }
  });
}

/**
 * Approve a spender to use tokens
 * 
 * @param tokenAddress ERC20 token contract address
 * @param spenderAddress Spender address to approve
 * @param amount Amount to approve in token units (e.g., "1.5" not wei)
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function approve(
  ethersService: EthersService,
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc20.approve');
  
  return timeAsync('erc20.approve', async () => {
    try {
      // Get provider and signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      
      // Get token info for decimals
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Parse input amount to wei equivalent based on token decimals
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Send transaction
      const tx = await contractWithSigner.approve(spenderAddress, amountInWei, overrides);
      
      // Invalidate allowance cache
      const walletAddress = await signer.getAddress();
      const allowanceCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_ALLOWANCE,
        tokenAddress,
        walletAddress,
        spenderAddress,
        chainId
      );
      balanceCache.delete(allowanceCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error approving ERC20 tokens', { tokenAddress, spenderAddress, amount, error });
      throw handleTokenError(error, 'Failed to approve token spending');
    }
  });
}

/**
 * Transfer tokens from one address to another (requires approval)
 * 
 * @param tokenAddress ERC20 token contract address
 * @param senderAddress Address to transfer from
 * @param recipientAddress Recipient address
 * @param amount Amount to transfer in token units (e.g., "1.5" not wei)
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function transferFrom(
  ethersService: EthersService,
  tokenAddress: string,
  senderAddress: string,
  recipientAddress: string,
  amount: string,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc20.transferFrom');
  
  return timeAsync('erc20.transferFrom', async () => {
    try {
      // Get provider and signer from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      const signer = ethersService['getSigner'](provider, chainId);
      const signerAddress = await signer.getAddress();
      
      // Get token info for decimals
      const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
      
      // Parse input amount to wei equivalent based on token decimals
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      
      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethersProvider);
      
      // Check sender's balance
      const balance = await contract.balanceOf(senderAddress);
      if (balance < amountInWei) {
        throw new InsufficientBalanceError(
          tokenAddress,
          ethers.formatUnits(amountInWei, tokenInfo.decimals),
          ethers.formatUnits(balance, tokenInfo.decimals)
        );
      }
      
      // Check allowance
      const allowance = await contract.allowance(senderAddress, signerAddress);
      if (allowance < amountInWei) {
        throw new InsufficientAllowanceError(
          tokenAddress,
          signerAddress,
          ethers.formatUnits(amountInWei, tokenInfo.decimals),
          ethers.formatUnits(allowance, tokenInfo.decimals)
        );
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Send transaction
      const tx = await contractWithSigner.transferFrom(
        senderAddress,
        recipientAddress,
        amountInWei,
        overrides
      );
      
      // Invalidate caches
      const senderCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_BALANCE,
        tokenAddress,
        senderAddress,
        chainId
      );
      const recipientCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_BALANCE,
        tokenAddress,
        recipientAddress,
        chainId
      );
      const allowanceCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC20_ALLOWANCE,
        tokenAddress,
        senderAddress,
        signerAddress,
        chainId
      );
      balanceCache.delete(senderCacheKey);
      balanceCache.delete(recipientCacheKey);
      balanceCache.delete(allowanceCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error in transferFrom for ERC20 tokens', { tokenAddress, senderAddress, recipientAddress, amount, error });
      throw handleTokenError(error, 'Failed to transfer tokens from sender');
    }
  });
}

/**
 * Parse a token amount from human-readable to raw units
 * 
 * @param amount Amount in human-readable format (e.g., "1.5")
 * @param tokenAddress ERC20 token contract address
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with parsed amount as bigint
 */
export async function parseTokenAmount(
  ethersService: EthersService,
  amount: string,
  tokenAddress: string,
  provider?: string,
  chainId?: number
): Promise<bigint> {
  try {
    // Get token info for decimals
    const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
    
    // Parse the amount
    return ethers.parseUnits(amount, tokenInfo.decimals);
  } catch (error) {
    logger.debug('Error parsing token amount', { amount, tokenAddress, error });
    throw handleTokenError(error, 'Failed to parse token amount');
  }
}

/**
 * Format a token amount from raw units to human-readable format
 * 
 * @param amount Amount in raw units (wei equivalent)
 * @param tokenAddress ERC20 token contract address
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with formatted amount as string
 */
export async function formatTokenAmount(
  ethersService: EthersService,
  amount: string | bigint,
  tokenAddress: string,
  provider?: string,
  chainId?: number
): Promise<string> {
  try {
    // Get token info for decimals
    const tokenInfo = await getTokenInfo(ethersService, tokenAddress, provider, chainId);
    
    // Format the amount
    return ethers.formatUnits(amount, tokenInfo.decimals);
  } catch (error) {
    logger.debug('Error formatting token amount', { amount, tokenAddress, error });
    throw handleTokenError(error, 'Failed to format token amount');
  }
} 