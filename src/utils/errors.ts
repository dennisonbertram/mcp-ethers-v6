/**
 * @file Error Handling Utilities
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-07
 * 
 * Standardized error handling system for MCP Ethers Wallet
 * 
 * IMPORTANT:
 * - Add tests for any new error types
 * - Maintain consistent error codes
 * 
 * Functionality:
 * - Custom error classes
 * - Error serialization
 * - Error codes
 */

// Base error class for all application errors
export class EthersServerError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly statusCode: number;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    details?: Record<string, any>,
    statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Serialize the error for API responses
  public serialize(): Record<string, any> {
    return {
      error: {
        message: this.message,
        code: this.code,
        details: this.details || {},
      }
    };
  }
}

// Network-related errors
export class NetworkError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', details, 503);
  }
}

// Provider-related errors
export class ProviderError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PROVIDER_ERROR', details, 500);
  }
}

// Contract-related errors
export class ContractError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONTRACT_ERROR', details, 400);
  }
}

// Transaction-related errors
export class TransactionError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'TRANSACTION_ERROR', details, 400);
  }
}

// Wallet-related errors
export class WalletError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'WALLET_ERROR', details, 400);
  }
}

// Configuration errors
export class ConfigurationError extends EthersServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', details, 500);
  }
}

// Handle and format unknown errors
export function handleUnknownError(error: unknown): EthersServerError {
  if (error instanceof EthersServerError) {
    return error;
  }
  
  let message = 'An unknown error occurred';
  let details: Record<string, any> = {};
  
  if (error instanceof Error) {
    message = error.message;
    details = { stack: error.stack };
  } else if (typeof error === 'string') {
    message = error;
  } else if (error !== null && typeof error === 'object') {
    details = { ...error };
  }
  
  return new EthersServerError(message, 'UNKNOWN_ERROR', details);
} 