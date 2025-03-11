/**
 * @file ERC Standards Utilities
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Utility functions for ERC token standards
 */

import { ethers } from 'ethers';
import { createCacheKey } from '../../utils/cache';
import { metrics, timeAsync } from '../../utils/metrics';
import { logger } from '../../utils/logger';
import { TokenNotFoundError, handleTokenError } from './errors';
import { INTERFACE_IDS } from './constants';
import { NFTMetadata } from './types';

/**
 * Interface check result with contract type
 */
interface ContractTypeResult {
  isERC20: boolean;
  isERC721: boolean;
  isERC1155: boolean;
}

/**
 * Check if an address is a valid contract and determine its type
 * 
 * @param address Contract address to check
 * @param provider Ethers provider
 * @returns ContractTypeResult with flags for contract types
 */
export async function checkContractType(
  address: string,
  provider: ethers.Provider
): Promise<ContractTypeResult> {
  try {
    // Check if the address has code (is a contract)
    const code = await provider.getCode(address);
    if (code === '0x' || code === '0x0') {
      throw new TokenNotFoundError(address);
    }
    
    // Create contract instance for interface checks
    const contract = new ethers.Contract(
      address,
      ['function supportsInterface(bytes4 interfaceId) view returns (bool)'],
      provider
    );
    
    let isERC721 = false;
    let isERC1155 = false;
    
    // Try ERC165 interface check first
    try {
      // Check if contract supports ERC165 interface
      const supportsERC165 = await contract.supportsInterface(INTERFACE_IDS.ERC165);
      
      if (supportsERC165) {
        // Check for ERC721
        isERC721 = await contract.supportsInterface(INTERFACE_IDS.ERC721);
        
        // Check for ERC1155
        isERC1155 = await contract.supportsInterface(INTERFACE_IDS.ERC1155);
      }
    } catch (error) {
      // Contract doesn't implement ERC165, continue with heuristic checks
      logger.debug('Contract does not support ERC165 interface check', { address });
    }
    
    // If we couldn't determine through supportsInterface, use heuristic approach
    if (!isERC721 && !isERC1155) {
      // Create contract with combined ABI for detection
      const detectContract = new ethers.Contract(
        address,
        [
          // ERC20 functions
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)',
          'function balanceOf(address) view returns (uint256)',
          'function transfer(address, uint256) returns (bool)',
          
          // ERC721 specific functions
          'function ownerOf(uint256) view returns (address)',
          'function tokenURI(uint256) view returns (string)',
          
          // ERC1155 specific functions
          'function balanceOfBatch(address[], uint256[]) view returns (uint256[])',
          'function uri(uint256) view returns (string)'
        ],
        provider
      );
      
      // Try to detect ERC20 by checking for common methods
      let isERC20 = false;
      try {
        // Check for basic ERC20 functions
        const [name, symbol, decimals] = await Promise.all([
          detectContract.name(),
          detectContract.symbol(),
          detectContract.decimals()
        ]);
        
        // If we got this far, it likely implements ERC20
        isERC20 = true;
      } catch (error) {
        isERC20 = false;
      }
      
      // If not already detected as ERC721, try additional checks
      if (!isERC721) {
        try {
          // Try calling ownerOf for token ID 1 - will fail if not ERC721
          // but we don't care about the result, just if the method exists
          await detectContract.ownerOf(1);
          isERC721 = true;
        } catch (error) {
          // If the error indicates "nonexistent token" it's likely an ERC721
          // with no token ID 1, otherwise it's not an ERC721
          const errorMsg = error instanceof Error ? error.message.toLowerCase() : '';
          isERC721 = errorMsg.includes('nonexistent token') || errorMsg.includes('invalid token id');
        }
      }
      
      // If not already detected as ERC1155, try additional checks
      if (!isERC1155) {
        try {
          // Try calling uri for token ID 1
          await detectContract.uri(1);
          isERC1155 = true;
        } catch (error) {
          isERC1155 = false;
        }
      }
      
      return { isERC20, isERC721, isERC1155 };
    }
    
    // If we determined through supportsInterface, assume it's not ERC20 if it's ERC721 or ERC1155
    const isERC20 = !isERC721 && !isERC1155;
    
    return { isERC20, isERC721, isERC1155 };
  } catch (error) {
    if (error instanceof TokenNotFoundError) {
      throw error;
    }
    
    logger.debug('Error checking contract type', { address, error });
    throw handleTokenError(error, 'Failed to determine contract type');
  }
}

/**
 * Fetches and parses metadata from a token URI
 * 
 * @param uri The URI to fetch metadata from
 * @param tokenAddress The token contract address
 * @param tokenId The token ID
 * @returns Parsed NFT metadata
 */
export async function fetchMetadata(
  uri: string,
  tokenAddress: string,
  tokenId: string | number
): Promise<NFTMetadata> {
  metrics.incrementCounter('token.metadata.fetch');
  return timeAsync('token.metadata.fetch', async () => {
    try {
      // Handle different URI formats
      let metadataUrl = uri;
      
      // Replace ipfs:// with https gateway
      if (uri.startsWith('ipfs://')) {
        metadataUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      // Handle tokenID placeholder in URI
      metadataUrl = metadataUrl.replace('{id}', tokenId.toString());
      
      // Add timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const response = await fetch(metadataUrl, { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }
        
        const metadata = await response.json();
        return metadata as NFTMetadata;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logger.debug('Error fetching token metadata', { uri, tokenAddress, tokenId, error });
      
      // Return minimal metadata when fetch fails
      return {
        name: `Token #${tokenId}`,
        description: 'Metadata could not be retrieved',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
}

/**
 * Creates a cache key for token data
 * 
 * @param keyPrefix Cache key prefix
 * @param tokenAddress Token contract address
 * @param additionalParts Additional parts to include in the key
 * @returns Cache key string
 */
export function createTokenCacheKey(
  keyPrefix: string,
  tokenAddress: string,
  ...additionalParts: (string | number | undefined)[]
): string {
  return createCacheKey(keyPrefix, tokenAddress.toLowerCase(), ...additionalParts);
} 