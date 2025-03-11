/**
 * @file ERC Standards Types
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Type definitions for ERC token standards
 */

import { ethers } from 'ethers';

/**
 * Basic ERC20 token information
 */
export interface ERC20Info {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

/**
 * Basic ERC721 NFT information
 */
export interface ERC721Info {
  name: string;
  symbol: string;
  totalSupply?: string;
}

/**
 * Extended NFT metadata based on ERC721 metadata standard
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_data?: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number;
    display_type?: string;
  }>;
  [key: string]: any; // Allow for additional properties
}

/**
 * ERC1155 token information with balance
 */
export interface ERC1155TokenInfo {
  tokenId: string;
  balance: string;
  metadata?: NFTMetadata;
}

/**
 * ERC721 token information
 */
export interface ERC721TokenInfo {
  tokenId: string;
  metadata?: NFTMetadata;
}

/**
 * Options for token operations
 */
export interface TokenOperationOptions {
  gasLimit?: string | number;
  gasPrice?: string | number;
  maxFeePerGas?: string | number;
  maxPriorityFeePerGas?: string | number;
  nonce?: number;
  value?: string;
  chainId?: number;
}

/**
 * Result of a token transaction
 */
export interface TokenTransactionResult {
  hash: string;
  wait: () => Promise<ethers.TransactionReceipt>;
} 