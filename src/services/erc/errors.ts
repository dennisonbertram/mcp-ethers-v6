/**
 * @file ERC Standards Errors
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Custom error classes for ERC token standards
 */

import { EthersServerError } from '../../utils/errors.js';

/**
 * Base class for token-related errors
 */
export class TokenError extends EthersServerError {
  constructor(message: string, code: string = 'TOKEN_ERROR', details?: Record<string, any>) {
    super(message, code, details, 400);
  }
}

/**
 * ERC20-specific errors
 */
export class ERC20Error extends TokenError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERC20_ERROR', details);
  }
}

/**
 * ERC721-specific errors
 */
export class ERC721Error extends TokenError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERC721_ERROR', details);
  }
}

/**
 * ERC1155-specific errors
 */
export class ERC1155Error extends TokenError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERC1155_ERROR', details);
  }
}

/**
 * Error for insufficient token balance
 */
export class InsufficientBalanceError extends TokenError {
  constructor(tokenAddress: string, required: string, available: string, details?: Record<string, any>) {
    super(
      `Insufficient token balance. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_BALANCE',
      {
        tokenAddress,
        required,
        available,
        ...details
      }
    );
  }
}

/**
 * Error for insufficient allowance
 */
export class InsufficientAllowanceError extends ERC20Error {
  constructor(tokenAddress: string, spender: string, required: string, available: string, details?: Record<string, any>) {
    super(
      `Insufficient token allowance for spender. Required: ${required}, Available: ${available}`,
      {
        tokenAddress,
        spender,
        required,
        available,
        ...details
      }
    );
  }
}

/**
 * Error when token doesn't exist
 */
export class TokenNotFoundError extends TokenError {
  constructor(tokenAddress: string, tokenId?: string | number, details?: Record<string, any>) {
    super(
      tokenId 
        ? `Token ID ${tokenId} not found in contract ${tokenAddress}`
        : `Token contract not found at address ${tokenAddress}`,
      'TOKEN_NOT_FOUND',
      {
        tokenAddress,
        tokenId,
        ...details
      }
    );
  }
}

/**
 * Error when caller is not authorized
 */
export class UnauthorizedTokenActionError extends TokenError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'UNAUTHORIZED_TOKEN_ACTION',
      details
    );
  }
}

/**
 * Error when a token metadata URI is invalid or unreachable
 */
export class TokenMetadataError extends TokenError {
  constructor(tokenAddress: string, tokenId: string | number, uri?: string, details?: Record<string, any>) {
    super(
      `Failed to fetch metadata for token ID ${tokenId} in contract ${tokenAddress}`,
      'TOKEN_METADATA_ERROR',
      {
        tokenAddress,
        tokenId,
        uri,
        ...details
      }
    );
  }
}

/**
 * Helper function to handle common token errors
 */
export function handleTokenError(error: unknown, context: string): never {
  // Check if it's already a TokenError
  if (error instanceof TokenError) {
    throw error;
  }
  
  // Handle common Ethereum errors
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('insufficient funds')) {
      throw new InsufficientBalanceError(
        'native', 
        'unknown',
        'unknown',
        { originalError: error.message }
      );
    }
    
    if (errorMessage.includes('execution reverted')) {
      if (errorMessage.includes('erc20: transfer amount exceeds balance')) {
        throw new InsufficientBalanceError(
          'unknown',
          'unknown',
          'unknown',
          { originalError: error.message }
        );
      }
      
      if (errorMessage.includes('erc20: transfer amount exceeds allowance')) {
        throw new InsufficientAllowanceError(
          'unknown',
          'unknown',
          'unknown',
          'unknown',
          { originalError: error.message }
        );
      }
      
      if (errorMessage.includes('owner query for nonexistent token')) {
        throw new TokenNotFoundError(
          'unknown',
          'unknown',
          { originalError: error.message }
        );
      }
      
      if (errorMessage.includes('not owner') || 
          errorMessage.includes('caller is not owner') ||
          errorMessage.includes('caller is not token owner')) {
        throw new UnauthorizedTokenActionError(
          'Not authorized to perform this action on the token',
          { originalError: error.message }
        );
      }
    }
    
    throw new TokenError(
      `${context}: ${error.message}`,
      'TOKEN_ERROR',
      { originalError: error.message }
    );
  }
  
  // Handle unknown errors
  throw new TokenError(
    `${context}: Unknown error`,
    'TOKEN_ERROR',
    { originalError: error }
  );
} 