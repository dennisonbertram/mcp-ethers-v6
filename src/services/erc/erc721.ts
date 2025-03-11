/**
 * @file ERC721 NFT Helpers
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Helper functions for interacting with ERC721 NFT tokens
 */

import { ethers } from 'ethers';
import { EthersService } from '../ethersService';
import { ERC721_ABI, CACHE_KEYS } from './constants';
import { ERC721Info, ERC721TokenInfo, NFTMetadata, TokenOperationOptions } from './types';
import { 
  ERC721Error, 
  TokenNotFoundError, 
  TokenMetadataError,
  UnauthorizedTokenActionError,
  handleTokenError 
} from './errors';
import { createTokenCacheKey, fetchMetadata } from './utils';
import { contractCache, ensCache } from '../../utils/cache';
import { logger } from '../../utils/logger';
import { metrics, timeAsync } from '../../utils/metrics';
import { rateLimiter } from '../../utils/rateLimiter';

/**
 * Get basic information about an ERC721 NFT collection
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with NFT collection information
 */
export async function getNFTInfo(
  ethersService: EthersService,
  contractAddress: string,
  provider?: string,
  chainId?: number
): Promise<ERC721Info> {
  metrics.incrementCounter('erc721.getNFTInfo');
  
  return timeAsync('erc721.getNFTInfo', async () => {
    try {
      // Check rate limiting
      const identity = `${contractAddress}:${provider || 'default'}`;
      if (!rateLimiter.consume('token', identity)) {
        throw new ERC721Error('Rate limit exceeded for NFT operations');
      }
      
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_INFO,
        contractAddress,
        chainId
      );
      
      // Check cache first
      const cachedInfo = contractCache.get(cacheKey);
      if (cachedInfo) {
        return cachedInfo as ERC721Info;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Check if address is contract
      const code = await ethersProvider.getCode(contractAddress);
      if (code === '0x' || code === '0x0') {
        throw new TokenNotFoundError(contractAddress);
      }
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Fetch NFT information - some contracts might not implement all methods
      let name = '';
      let symbol = '';
      let totalSupply: string | undefined = undefined;
      
      try {
        name = await contract.name();
      } catch (error) {
        logger.debug('Error getting NFT name', { contractAddress, error });
        name = 'Unknown Collection';
      }
      
      try {
        symbol = await contract.symbol();
      } catch (error) {
        logger.debug('Error getting NFT symbol', { contractAddress, error });
        symbol = 'NFT';
      }
      
      try {
        // totalSupply is optional in ERC721
        const supplyBigInt = await contract.totalSupply();
        totalSupply = supplyBigInt.toString();
      } catch (error) {
        // totalSupply function is not required in ERC721, so ignore errors
        logger.debug('NFT contract does not implement totalSupply', { contractAddress });
      }
      
      // Format data
      const nftInfo: ERC721Info = {
        name,
        symbol,
        totalSupply
      };
      
      // Cache result for future use (1 hour TTL)
      contractCache.set(cacheKey, nftInfo, { ttl: 3600000 });
      
      return nftInfo;
    } catch (error) {
      logger.debug('Error getting ERC721 NFT info', { contractAddress, error });
      
      if (error instanceof TokenNotFoundError) {
        throw error;
      }
      
      throw handleTokenError(error, 'Failed to get NFT collection information');
    }
  });
}

/**
 * Get the owner of a specific NFT
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param tokenId Token ID to check ownership
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with owner address
 */
export async function ownerOf(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc721.ownerOf');
  
  return timeAsync('erc721.ownerOf', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_OWNER,
        contractAddress,
        tokenId,
        chainId
      );
      
      // Check cache first
      const cachedOwner = ensCache.get(cacheKey);
      if (cachedOwner) {
        return cachedOwner;
      }
      
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Get owner
      const owner = await contract.ownerOf(tokenId);
      
      // Cache result for future use (30 seconds TTL)
      ensCache.set(cacheKey, owner, { ttl: 30000 });
      
      return owner;
    } catch (error) {
      logger.debug('Error getting NFT owner', { contractAddress, tokenId, error });
      
      // Check for common errors
      if (error instanceof Error && 
          (error.message.includes('owner query for nonexistent token') ||
           error.message.includes('invalid token ID'))) {
        throw new TokenNotFoundError(contractAddress, tokenId);
      }
      
      throw handleTokenError(error, 'Failed to get NFT owner');
    }
  });
}

/**
 * Get the token URI for a specific NFT
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param tokenId Token ID
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with token URI
 */
export async function getTokenURI(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc721.getTokenURI');
  
  return timeAsync('erc721.getTokenURI', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_TOKEN_URI,
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
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Try to get token URI
      let tokenURI;
      try {
        // Try standard tokenURI method
        tokenURI = await contract.tokenURI(tokenId);
      } catch (error) {
        // If tokenURI fails, try uri method (some contracts use this instead)
        try {
          tokenURI = await contract.uri(tokenId);
        } catch (innerError) {
          throw error; // If both fail, use the original error
        }
      }
      
      // Cache result for future use (1 hour TTL)
      ensCache.set(cacheKey, tokenURI, { ttl: 3600000 });
      
      return tokenURI;
    } catch (error) {
      logger.debug('Error getting NFT token URI', { contractAddress, tokenId, error });
      
      // Check for common errors
      if (error instanceof Error && 
          (error.message.includes('nonexistent token') ||
           error.message.includes('invalid token ID'))) {
        throw new TokenNotFoundError(contractAddress, tokenId);
      }
      
      throw handleTokenError(error, 'Failed to get NFT token URI');
    }
  });
}

/**
 * Get and parse metadata for a specific NFT
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param tokenId Token ID
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with parsed metadata
 */
export async function getMetadata(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<NFTMetadata> {
  metrics.incrementCounter('erc721.getMetadata');
  
  return timeAsync('erc721.getMetadata', async () => {
    try {
      // Create cache key
      const cacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_METADATA,
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
      const tokenURI = await getTokenURI(ethersService, contractAddress, tokenId, provider, chainId);
      
      // Fetch and parse metadata
      const metadata = await fetchMetadata(tokenURI, contractAddress, tokenId);
      
      // Cache result for future use (1 hour TTL)
      contractCache.set(cacheKey, metadata, { ttl: 3600000 });
      
      return metadata;
    } catch (error) {
      logger.debug('Error getting NFT metadata', { contractAddress, tokenId, error });
      
      if (error instanceof TokenNotFoundError) {
        throw error;
      }
      
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
 * Get the NFT balance of an address
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param ownerAddress Owner address to check
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with number of NFTs owned
 */
export async function balanceOf(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddress: string,
  provider?: string,
  chainId?: number
): Promise<number> {
  metrics.incrementCounter('erc721.balanceOf');
  
  return timeAsync('erc721.balanceOf', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Get balance
      const balance = await contract.balanceOf(ownerAddress);
      
      return Number(balance);
    } catch (error) {
      logger.debug('Error getting NFT balance', { contractAddress, ownerAddress, error });
      throw handleTokenError(error, 'Failed to get NFT balance');
    }
  });
}

/**
 * Check if an operator is approved to manage all NFTs
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
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
  metrics.incrementCounter('erc721.isApprovedForAll');
  
  return timeAsync('erc721.isApprovedForAll', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Check approval
      const isApproved = await contract.isApprovedForAll(ownerAddress, operatorAddress);
      
      return isApproved;
    } catch (error) {
      logger.debug('Error checking NFT approval', { contractAddress, ownerAddress, operatorAddress, error });
      throw handleTokenError(error, 'Failed to check NFT approval status');
    }
  });
}

/**
 * Get the approved address for a specific NFT
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param tokenId Token ID to check
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with approved address
 */
export async function getApproved(
  ethersService: EthersService,
  contractAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number
): Promise<string> {
  metrics.incrementCounter('erc721.getApproved');
  
  return timeAsync('erc721.getApproved', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Get approved address
      const approved = await contract.getApproved(tokenId);
      
      return approved;
    } catch (error) {
      logger.debug('Error getting approved address for NFT', { contractAddress, tokenId, error });
      
      // Check for common errors
      if (error instanceof Error && 
          (error.message.includes('nonexistent token') ||
           error.message.includes('invalid token ID'))) {
        throw new TokenNotFoundError(contractAddress, tokenId);
      }
      
      throw handleTokenError(error, 'Failed to get approved address for NFT');
    }
  });
}

/**
 * Transfer an NFT to a new owner
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param toAddress Recipient address
 * @param tokenId Token ID to transfer
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function transferNFT(
  ethersService: EthersService,
  contractAddress: string,
  toAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc721.transferNFT');
  
  return timeAsync('erc721.transferNFT', async () => {
    try {
      // Check rate limiting for write operations
      const identity = `${contractAddress}:transfer`;
      if (!rateLimiter.consume('transaction', identity)) {
        throw new ERC721Error('Rate limit exceeded for NFT transfers');
      }
      
      // Get provider and signer from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      const signer = ethersService['getSigner'](provider, chainId);
      const fromAddress = await signer.getAddress();
      
      // Check ownership
      const owner = await ownerOf(ethersService, contractAddress, tokenId, provider, chainId);
      
      if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
        // Check if signer is approved
        const approved = await getApproved(ethersService, contractAddress, tokenId, provider, chainId);
        const isApproved = await isApprovedForAll(ethersService, contractAddress, owner, fromAddress, provider, chainId);
        
        if (approved.toLowerCase() !== fromAddress.toLowerCase() && !isApproved) {
          throw new UnauthorizedTokenActionError(
            `Not authorized to transfer token #${tokenId}. You are not the owner or approved operator.`
          );
        }
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC721_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      if (options.value) overrides.value = options.value;
      
      // Send transaction
      const tx = await contractWithSigner.transferFrom(fromAddress, toAddress, tokenId, overrides);
      
      // Invalidate caches
      const ownerCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_OWNER,
        contractAddress,
        tokenId,
        chainId
      );
      ensCache.delete(ownerCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error transferring NFT', { contractAddress, tokenId, error });
      throw handleTokenError(error, 'Failed to transfer NFT');
    }
  });
}

/**
 * Safely transfer an NFT to a new owner
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param toAddress Recipient address
 * @param tokenId Token ID to transfer
 * @param data Optional data to include
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function safeTransferNFT(
  ethersService: EthersService,
  contractAddress: string,
  toAddress: string,
  tokenId: string | number,
  data: string = '0x',
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc721.safeTransferNFT');
  
  return timeAsync('erc721.safeTransferNFT', async () => {
    try {
      // Check rate limiting for write operations
      const identity = `${contractAddress}:safeTransfer`;
      if (!rateLimiter.consume('transaction', identity)) {
        throw new ERC721Error('Rate limit exceeded for NFT transfers');
      }
      
      // Get provider and signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      const fromAddress = await signer.getAddress();
      
      // Check ownership (reuses previous function)
      const owner = await ownerOf(ethersService, contractAddress, tokenId, provider, chainId);
      
      if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
        // Check if signer is approved
        const approved = await getApproved(ethersService, contractAddress, tokenId, provider, chainId);
        const isApproved = await isApprovedForAll(ethersService, contractAddress, owner, fromAddress, provider, chainId);
        
        if (approved.toLowerCase() !== fromAddress.toLowerCase() && !isApproved) {
          throw new UnauthorizedTokenActionError(
            `Not authorized to transfer token #${tokenId}. You are not the owner or approved operator.`
          );
        }
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC721_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      if (options.value) overrides.value = options.value;
      
      // Send transaction with data parameter
      const tx = await contractWithSigner.safeTransferFrom(fromAddress, toAddress, tokenId, data, overrides);
      
      // Invalidate caches
      const ownerCacheKey = createTokenCacheKey(
        CACHE_KEYS.ERC721_OWNER,
        contractAddress,
        tokenId,
        chainId
      );
      ensCache.delete(ownerCacheKey);
      
      return tx;
    } catch (error) {
      logger.debug('Error safely transferring NFT', { contractAddress, tokenId, error });
      throw handleTokenError(error, 'Failed to safely transfer NFT');
    }
  });
}

/**
 * Approve an address to manage a specific NFT
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param approvedAddress Address to approve
 * @param tokenId Token ID to approve for
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @param options Optional transaction options
 * @returns Promise with transaction response
 */
export async function approve(
  ethersService: EthersService,
  contractAddress: string,
  approvedAddress: string,
  tokenId: string | number,
  provider?: string,
  chainId?: number,
  options: TokenOperationOptions = {}
): Promise<ethers.TransactionResponse> {
  metrics.incrementCounter('erc721.approve');
  
  return timeAsync('erc721.approve', async () => {
    try {
      // Get provider and signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      const signerAddress = await signer.getAddress();
      
      // Check ownership
      const owner = await ownerOf(ethersService, contractAddress, tokenId, provider, chainId);
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        // Check if signer is approved for all
        const isApproved = await isApprovedForAll(ethersService, contractAddress, owner, signerAddress, provider, chainId);
        
        if (!isApproved) {
          throw new UnauthorizedTokenActionError(
            `Not authorized to approve token #${tokenId}. You are not the owner or approved operator.`
          );
        }
      }
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC721_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Send transaction
      const tx = await contractWithSigner.approve(approvedAddress, tokenId, overrides);
      
      return tx;
    } catch (error) {
      logger.debug('Error approving address for NFT', { contractAddress, tokenId, approvedAddress, error });
      throw handleTokenError(error, 'Failed to approve address for NFT');
    }
  });
}

/**
 * Approve an operator to manage all NFTs
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
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
  metrics.incrementCounter('erc721.setApprovalForAll');
  
  return timeAsync('erc721.setApprovalForAll', async () => {
    try {
      // Get signer from ethers service
      const signer = ethersService['getSigner'](provider, chainId);
      
      // Create contract instance with signer
      const contractWithSigner = new ethers.Contract(contractAddress, ERC721_ABI, signer);
      
      // Prepare transaction overrides
      const overrides: ethers.Overrides = {};
      if (options.gasLimit) overrides.gasLimit = options.gasLimit;
      if (options.gasPrice) overrides.gasPrice = options.gasPrice;
      if (options.maxFeePerGas) overrides.maxFeePerGas = options.maxFeePerGas;
      if (options.maxPriorityFeePerGas) overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options.nonce !== undefined) overrides.nonce = options.nonce;
      
      // Send transaction
      const tx = await contractWithSigner.setApprovalForAll(operatorAddress, approved, overrides);
      
      return tx;
    } catch (error) {
      logger.debug('Error setting approval for all NFTs', { contractAddress, operatorAddress, approved, error });
      throw handleTokenError(error, 'Failed to set approval for all NFTs');
    }
  });
}

/**
 * Get all NFTs owned by an address
 * 
 * @param ethersService EthersService instance
 * @param contractAddress NFT contract address
 * @param ownerAddress Owner address to check
 * @param includeMetadata Whether to include metadata
 * @param provider Optional provider name or instance
 * @param chainId Optional chain ID
 * @returns Promise with array of owned NFTs
 */
export async function getUserNFTs(
  ethersService: EthersService,
  contractAddress: string,
  ownerAddress: string,
  includeMetadata: boolean = false,
  provider?: string,
  chainId?: number
): Promise<ERC721TokenInfo[]> {
  metrics.incrementCounter('erc721.getUserNFTs');
  
  return timeAsync('erc721.getUserNFTs', async () => {
    try {
      // Get provider from ethers service
      const ethersProvider = ethersService['getProvider'](provider, chainId);
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, ethersProvider);
      
      // Check if contract supports enumeration
      let supportsEnumeration = false;
      try {
        supportsEnumeration = await contract.supportsInterface('0x780e9d63'); // ERC721Enumerable
      } catch (error) {
        // Contract doesn't support supportsInterface, try with heuristic
        try {
          await contract.tokenOfOwnerByIndex(ownerAddress, 0);
          supportsEnumeration = true;
        } catch (error2) {
          supportsEnumeration = false;
        }
      }
      
      // Get NFT count for owner
      const balance = await contract.balanceOf(ownerAddress);
      const balanceNumber = Number(balance);
      
      if (balanceNumber === 0) {
        return [];
      }
      
      let ownedTokens: ERC721TokenInfo[] = [];
      
      if (supportsEnumeration) {
        // Contract supports enumeration, we can get tokens directly
        const tokenPromises = Array.from({ length: balanceNumber }, (_, i) => 
          contract.tokenOfOwnerByIndex(ownerAddress, i)
            .then(tokenId => ({ tokenId: tokenId.toString() }))
        );
        
        ownedTokens = await Promise.all(tokenPromises);
      } else {
        // Contract doesn't support enumeration, we need to scan events
        logger.debug('NFT contract does not support enumeration, using events', { contractAddress });
        
        // Find transfer events to this owner
        const filter = contract.filters.Transfer(null, ownerAddress);
        const events = await contract.queryFilter(filter);
        
        // Map of token IDs to ensure uniqueness (owner might have received same token multiple times)
        const tokenMap = new Map<string, boolean>();
        
        // Check current ownership of each token from events
        const ownershipChecks = events.map(async event => {
          const tokenId = event.args[2].toString();
          
          // Skip if we've already processed this token
          if (tokenMap.has(tokenId)) {
            return null;
          }
          
          tokenMap.set(tokenId, true);
          
          // Verify current ownership
          try {
            const currentOwner = await contract.ownerOf(tokenId);
            if (currentOwner.toLowerCase() === ownerAddress.toLowerCase()) {
              return { tokenId };
            }
          } catch {
            // Token no longer exists or not owned by user
          }
          
          return null;
        });
        
        // Filter out tokens that are no longer owned
        const tokensResults = await Promise.all(ownershipChecks);
        ownedTokens = tokensResults.filter(token => token !== null) as ERC721TokenInfo[];
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
      logger.debug('Error getting user NFTs', { contractAddress, ownerAddress, error });
      throw handleTokenError(error, 'Failed to get user NFTs');
    }
  });
} 