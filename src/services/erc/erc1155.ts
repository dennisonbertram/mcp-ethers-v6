/**
 * @file ERC1155 Multi-Token Helpers
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Helper functions for interacting with ERC1155 multi-tokens
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService.js';
import { ERC1155_ABI, CACHE_KEYS } from './constants.js';
import { ERC1155TokenInfo, NFTMetadata, TokenOperationOptions } from './types.js';
import {
  ERC1155Error,
  TokenNotFoundError,
  UnauthorizedTokenActionError,
  TokenMetadataError,
  handleTokenError
} from './errors.js';
import { createTokenCacheKey, fetchMetadata } from './utils.js';
import { balanceCache, contractCache, ensCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import { metrics, timeAsync } from '../../utils/metrics.js';
import { rateLimiter } from '../../utils/rateLimiter.js';

/**
 * Get token balance for a specific token ID
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param ownerAddress Owner address to check
 * @param tokenId Token ID to check balance
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with token balance as string
 */
export async function balanceOf(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc1155.balanceOf');
  
  return timeAsync('erc1155.balanceOf', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC1155_BALANCE,
        contractAddress,
        ownerAddress,
        tokenId,
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
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, ethersProvider);
      
      // Get balance
      const balance = await contract.balanceOf(ownerAddress, tokenId);
      const balanceStr = balance.toString();
      
      // Cache result for future use (30 second TTL)
      balanceCache.set(cacheKey, balanceStr, { ttl: 30000 });
      
      return balanceStr;
    } catch (error) {
      logger.debug('Error getting ERC1155 balance', { contractAddress, ownerAddress, tokenId, error });
      throw handleTokenError(error, 'Failed to get token balance');
    }
  });
}

/**
 * Get token balances for multiple token IDs at once
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param ownerAddresses Array of owner addresses
 * @param tokenIds Array of token IDs
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with array of token balances
 */
export async function balanceOfBatch(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddresses: string[],
  tokenIds: (string | number)[],
  provider?: string,
  chainId?: number
): Promise<string[]> {
  metrics.incrementCounter('erc1155.balanceOfBatch');
  
  return timeAsync('erc1155.balanceOfBatch', async () => {
    try {
      // Validate input lengths
      if (ownerAddresses.length !== tokenIds.length) {
        throw new ERC1155Error(
          'Owner addresses and token IDs arrays must have the same length'
        );
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, ethersProvider);
      
      // Get balances
      const balances = await contract.balanceOfBatch(ownerAddresses, tokenIds);
      
      // Convert to strings
      return balances.map((balance: bigint) => balance.toString());
    } catch (error) {
      logger.debug('Error getting ERC1155 batch balances', { contractAddress, error });
      throw handleTokenError(error, 'Failed to get token balances');
    }
  });
}

/**
 * Get the URI for a specific token ID
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param tokenId Token ID to get URI for
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with token URI
 */
export async function getURI(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc1155.getURI');
  
  return timeAsync('erc1155.getURI', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC1155_URI,
        contractAddress,
        tokenId,
        chainId
      );
      
      // Check cache first
      const cachedURI = ensCache.get(cacheKey);
      if (cachedURI) {
        return cachedURI;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, ethersProvider);
      
      // Get token URI
      const uri = await contract.uri(tokenId);
      
      // Cache result for future use (1 hour TTL)
      ensCache.set(cacheKey, uri, { ttl: 3600000 });
      
      return uri;
    } catch (error) {
      logger.debug('Error getting ERC1155 URI', { contractAddress, tokenId, error });
      throw handleTokenError(error, 'Failed to get token URI');
    }
  });
}

/**
 * Get metadata for a specific token ID
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param tokenId Token ID to get metadata for
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with token metadata
 */
export async function getMetadata(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<NFTMetadata> {
  metrics.incrementCounter('erc1155.getMetadata');
  
  return timeAsync('erc1155.getMetadata', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC1155_METADATA,
        contractAddress,
        tokenId,
        chainId
      );
      
      // Check cache first
      const cachedMetadata = contractCache.get(cacheKey);
      if (cachedMetadata) {
        return cachedMetadata as NFTMetadata;
      }
      
      // Get token URI
      const uri = await getURI(ethersService, contractAddress, tokenId, provider, chainId);
      
      // Fetch and parse metadata
      const metadata = await fetchMetadata(uri, contractAddress, tokenId);
      
      // Cache result for future use (1 hour TTL)
      contractCache.set(cacheKey, metadata, { ttl: 3600000 });
      
      return metadata;
    } catch (error) {
      logger.debug('Error getting ERC1155 metadata', { contractAddress, tokenId, error });
      
      // Handle metadata parsing errors
      if (!(error instanceof TokenMetadataError)) {
        throw new TokenMetadataError(contractAddress, tokenId, undefined, {
          originalError: error instanceof Error ? error.message : String(error)
        });
      }
      
      throw error;
    }
  });
}

/**
 * Check if an operator is approved for all tokens
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param ownerAddress Owner address
 * @param operatorAddress Operator address to check
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with approval status
 */
export async function isApprovedForAll(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddress: string,
  operatorAddress: string,
  provider?: string,
  chainId?: number
): Promise<boolean> {
  metrics.incrementCounter('erc1155.isApprovedForAll');
  
  return timeAsync('erc1155.isApprovedForAll', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, ethersProvider);
      
      // Check approval
      const isApproved = await contract.isApprovedForAll(ownerAddress, operatorAddress);
      
      return isApproved;
    } catch (error) {
      logger.debug('Error checking ERC1155 approval', { contractAddress, ownerAddress, operatorAddress, error });
      throw handleTokenError(error, 'Failed to check token approval status');
    }
  });
}

/**
 * Set approval for an operator to manage all tokens
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param operatorAddress Operator address to approve
 * @param approved Approval status to set
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function setApprovalForAll(
  ethersService: EthersService,
  contractAddress: string,
  operatorAddress: string,
  approved: boolean,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc1155.setApprovalForAll');
  
  return timeAsync('erc1155.setApprovalForAll', async () => {
    try {
      // Get signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Set approval
      const tx = await contractWithSigner.setApprovalForAll(operatorAddress, approved, overrides);
      
      return tx;
    } catch (error) {
      logger.debug('Error setting ERC1155 approval', { contractAddress, operatorAddress, approved, error });
      throw handleTokenError(error, 'Failed to set token approval');
    }
  });
}

/**
 * Safely transfer tokens to another address
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param fromAddress Sender address
 * @param toAddress Recipient address
 * @param tokenId Token ID to transfer
 * @param amount Amount to transfer
 * @param data Additional data to include with the transfer
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function safeTransferFrom(
  ethersService: EthersService,
  contractAddress: string,
  fromAddress: string,
  toAddress: string,
  tokenId: string | number,
  amount: string,
  data: string = '0x',
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc1155.safeTransferFrom');
  
  return timeAsync('erc1155.safeTransferFrom', async () => {
    try {
      // Check rate limiting for write operations
      const identity = `${contractAddress}:transfer`;
      if (!rateLimiter.consume('transaction', identity)) {
        throw new ERC1155Error('Rate limit exceeded for token transfers');
      }
      
      // Get provider and signer from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      const signer = ethersService['getSigner'](provider, chainId);
      const signerAddress = await signer.getAddress();
      
      // Verify ownership and approval
      if (fromAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        const isApproved = await isApprovedForAll(
          ethersService,
          contractAddress,
          fromAddress,
          signerAddress,
          provider,
          chainId
        );
        
        if (!isApproved) {
          throw new UnauthorizedTokenActionError(
            'Not authorized to transfer tokens from this address'
          );
        }
      }
      
      // Check balance
      const balance = BigInt(await balanceOf(
        ethersService,
        contractAddress,
        fromAddress,
        tokenId,
        provider,
        chainId
      ));
      
      const amountBigInt = BigInt(amount);
      
      if (balance < amountBigInt) {
        throw new ERC1155Error(
          `Insufficient balance for token ID ${tokenId}. Required: ${amount}, Available: ${balance.toString()}`
        );
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      if (options.value) overrides.value = options.value;
      
      // Send transaction
      const tx = await contractWithSigner.safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        amount,
        data,
        overrides
      );
      
      // Invalidate balance caches
      const fromCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC1155_BALANCE,
        contractAddress,
        fromAddress,
        tokenId,
        chainId
      );
      
      const toCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC1155_BALANCE,
        contractAddress,
        toAddress,
        tokenId,
        chainId
      );
      
      balanceCache.delete(fromCacheKey);
      balanceCache.delete(toCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error in ERC1155 safeTransferFrom', {
        contractAddress,
        fromAddress,
        toAddress,
        tokenId,
        amount,
        error
      });
      throw handleTokenError(error, 'Failed to transfer tokens');
    }
  });
}

/**
 * Safely transfer multiple tokens in a batch
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param fromAddress Sender address
 * @param toAddress Recipient address
 * @param tokenIds Array of token IDs to transfer
 * @param amounts Array of amounts to transfer
 * @param data Additional data to include with the transfer
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function safeBatchTransferFrom(
  ethersService: EthersService,
  contractAddress: string,
  fromAddress: string,
  toAddress: string,
  tokenIds: (string | number)[],
  amounts: string[],
  data: string = '0x',
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc1155.safeBatchTransferFrom');
  
  return timeAsync('erc1155.safeBatchTransferFrom', async () => {
    try {
      // Validate input lengths
      if (tokenIds.length !== amounts.length) {
        throw new ERC1155Error(
          'Token IDs and amounts arrays must have the same length'
        );
      }
      
      // Check rate limiting for write operations
      const identity = `${contractAddress}:batchTransfer`;
      if (!rateLimiter.consume('transaction', identity)) {
        throw new ERC1155Error('Rate limit exceeded for token transfers');
      }
      
      // Get signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      const signerAddress = await signer.getAddress();
      
      // Verify ownership and approval
      if (fromAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        const isApproved = await isApprovedForAll(
          ethersService,
          contractAddress,
          fromAddress,
          signerAddress,
          provider,
          chainId
        );
        
        if (!isApproved) {
          throw new UnauthorizedTokenActionError(
            'Not authorized to transfer tokens from this address'
          );
        }
      }
      
      // Check balances for all tokens
      const balancePromises = tokenIds.map((tokenId, index) =>
        balanceOf(ethersService, contractAddress, fromAddress, tokenId, provider, chainId)
          .then(balance => {
            const availableBalance = BigInt(balance);
            const requiredAmount = BigInt(amounts[index]);
            
            if (availableBalance < requiredAmount) {
              throw new ERC1155Error(
                `Insufficient balance for token ID ${tokenId}. Required: ${amounts[index]}, Available: ${balance}`
              );
            }
            
            return true;
          })
      );
      
      await Promise.all(balancePromises);
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      if (options.value) overrides.value = options.value;
      
      // Send transaction
      const tx = await contractWithSigner.safeBatchTransferFrom(
        fromAddress,
        toAddress,
        tokenIds,
        amounts,
        data,
        overrides
      );
      
      // Invalidate balance caches for all tokens
      tokenIds.forEach(tokenId => {
        const fromCacheKey = createTokenCacheKey(
          CACHE_KEYS.ERC1155_BALANCE,
          contractAddress,
          fromAddress,
          tokenId,
          chainId
        );
        
        const toCacheKey = createTokenCacheKey(
          CACHE_KEYS.ERC1155_BALANCE,
          contractAddress,
          toAddress,
          tokenId,
          chainId
        );
        
        balanceCache.delete(fromCacheKey);
        balanceCache.delete(toCacheKey);
      });
      
      return tx;
    } catch (error) {
      logger.debug('Error in ERC1155 safeBatchTransferFrom', {
        contractAddress,
        fromAddress,
        toAddress,
        tokenIds,
        amounts,
        error
      });
      throw handleTokenError(error, 'Failed to batch transfer tokens');
    }
  });
}

/**
 * Get all tokens owned by an address with balances and optional metadata
 * 
 * @param ethersService EthersService instance
 * @param contractAddress ERC1155 contract address
 * @param ownerAddress Owner address to check
 * @param tokenIds Optional array of specific token IDs to check (if not provided, will try to discover tokens)
 * @param includeMetadata Whether to include metadata
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with array of token info
 */
export async function getUserTokens(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddress: string,
  tokenIds?: (string | number)[],
  includeMetadata: boolean = false,
  provider?: string,
  chainId?: number
): Promise<ERC1155TokenInfo[]> {
  metrics.incrementCounter('erc1155.getUserTokens');
  
  return timeAsync('erc1155.getUserTokens', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, ethersProvider);
      
      let ownedTokens: ERC1155TokenInfo[] = [];
      
      if (tokenIds && tokenIds.length > 0) {
        // If specific token IDs are provided, check those
        const balancePromises = tokenIds.map(async tokenId => {
          const balance = await balanceOf(ethersService, contractAddress, ownerAddress, tokenId, provider, chainId);
          
          // Only include tokens with a non-zero balance
          if (balance !== '0') {
            return {
              tokenId: tokenId.toString(),
              balance
            };
          }
          
          return null;
        });
        
        const tokensWithBalances = await Promise.all(balancePromises);
        ownedTokens = tokensWithBalances.filter(token => token !== null) as ERC1155TokenInfo[];
      } else {
        // If no token IDs are provided, try to discover tokens using events
        logger.debug('No token IDs provided, discovering tokens from events', { contractAddress, ownerAddress });
        
        // Find transfers to this owner
        const filter = contract.filters.TransferSingle(null, null, ownerAddress);
        const events = await contract.queryFilter(filter);
        
        // Find batch transfers to this owner
        const batchFilter = contract.filters.TransferBatch(null, null, ownerAddress);
        const batchEvents = await contract.queryFilter(batchFilter);
        
        // Map of token IDs to ensure uniqueness
        const tokenMap = new Map<string, boolean>();
        
        // Process single transfers
        events.forEach(event => {
          // Use type guard to safely access args for EventLog
          const isEventLog = 'args' in event;
          
          // Access token ID safely with fallback to topics
          const tokenId = isEventLog ? 
            (event as ethers.EventLog).args[3].toString() : 
            (event.topics && event.topics.length > 3 ? ethers.dataSlice(event.topics[3], 0) : '0');
          
          tokenMap.set(tokenId, true);
        });
        
        // Process batch transfers
        batchEvents.forEach(event => {
          // For batch transfers we need to handle arrays of token IDs
          // Try to safely access the token IDs or parse from topics/data
          const isEventLog = 'args' in event;
          
          // Extract token IDs either from args (if EventLog) or from topics
          const tokenIdsFromArgs = isEventLog ? 
            (event as ethers.EventLog).args[3] : 
            undefined;
          
          const tokenIdsFromTopics = event.topics && event.topics.length > 3 
            ? [ethers.dataSlice(event.topics[3], 0)]
            : [];
          
          const tokenIds = tokenIdsFromArgs || tokenIdsFromTopics;
          
          if (Array.isArray(tokenIds)) {
            tokenIds.forEach((id: any) => {
              const idStr = typeof id === 'bigint' ? id.toString() : 
                            typeof id === 'string' ? id :
                            id?.toString?.() || '0';
              tokenMap.set(idStr, true);
            });
          } else if (tokenIds) {
            // Handle single token ID case
            const idStr = typeof tokenIds === 'bigint' ? tokenIds.toString() : 
                          typeof tokenIds === 'string' ? tokenIds : 
                          tokenIds?.toString?.() || '0';
            tokenMap.set(idStr, true);
          }
        });
        
        // Check balances for discovered tokens
        const discoveredTokenIds = Array.from(tokenMap.keys());
        logger.debug(`Discovered ${discoveredTokenIds.length} potential tokens`, { contractAddress });
        
        const balancePromises = discoveredTokenIds.map(async tokenId => {
          const balance = await balanceOf(ethersService, contractAddress, ownerAddress, tokenId, provider, chainId);
          
          // Only include tokens with a non-zero balance
          if (balance !== '0') {
            return {
              tokenId,
              balance
            };
          }
          
          return null;
        });
        
        const tokensWithBalances = await Promise.all(balancePromises);
        ownedTokens = tokensWithBalances.filter(token => token !== null) as ERC1155TokenInfo[];
      }
      
      // Include metadata if requested
      if (includeMetadata && ownedTokens.length > 0) {
        const metadataPromises = ownedTokens.map(async token => {
          try {
            token.metadata = await getMetadata(
              ethersService,
              contractAddress,
              token.tokenId,
              provider,
              chainId
            );
          } catch (error) {
            // Ignore metadata errors, just return token without metadata
            logger.debug('Error fetching metadata for token', { tokenId: token.tokenId, error });
          }
          return token;
        });
        
        ownedTokens = await Promise.all(metadataPromises);
      }
      
      return ownedTokens;
    } catch (error) {
      logger.debug('Error getting user tokens', { contractAddress, ownerAddress, error });
      throw handleTokenError(error, 'Failed to get user tokens');
    }
  });
} 