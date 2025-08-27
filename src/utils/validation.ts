/**
 * @file Validation Utilities with User-Friendly Error Messages
 * @version 1.0.0
 * 
 * Provides validation utilities that convert technical Zod errors
 * into user-friendly messages with helpful guidance
 */

import { z, ZodError, ZodSchema } from 'zod';
import { EthersServerError } from './errors.js';

/**
 * Parameter description with user-friendly formatting
 */
interface ParameterDescription {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: string;
  format?: string;
}

/**
 * Maps Zod issue codes to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, (path: string, issue: any) => string> = {
  invalid_type: (path, issue) => {
    const fieldName = formatFieldName(path);
    const expectedType = formatType(issue.expected);
    const receivedType = formatType(issue.received);
    
    if (receivedType === 'undefined') {
      return `Missing required parameter '${fieldName}'. Please provide a value of type ${expectedType}.`;
    }
    
    return `Invalid type for '${fieldName}'. Expected ${expectedType} but received ${receivedType}.`;
  },
  
  invalid_string: (path, issue) => {
    const fieldName = formatFieldName(path);
    
    if (issue.validation === 'regex') {
      // Special handling for common patterns
      if (path.includes('Address')) {
        return `Invalid Ethereum address format for '${fieldName}'. ` +
               `Expected format: 0x followed by 40 hexadecimal characters (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7).`;
      }
      if (path.includes('hash') || path.includes('Hash')) {
        return `Invalid transaction hash format for '${fieldName}'. ` +
               `Expected format: 0x followed by 64 hexadecimal characters.`;
      }
      return `Invalid format for '${fieldName}'. Please check the expected format.`;
    }
    
    if (issue.validation === 'email') {
      return `Invalid email format for '${fieldName}'. Please provide a valid email address.`;
    }
    
    if (issue.validation === 'url') {
      return `Invalid URL format for '${fieldName}'. Please provide a valid URL starting with http:// or https://.`;
    }
    
    return `Invalid string value for '${fieldName}'.`;
  },
  
  too_small: (path, issue) => {
    const fieldName = formatFieldName(path);
    
    if (issue.type === 'string') {
      return `Value for '${fieldName}' is too short. Minimum length is ${issue.minimum} characters.`;
    }
    
    if (issue.type === 'array') {
      return `Array '${fieldName}' has too few items. Minimum required: ${issue.minimum}.`;
    }
    
    return `Value for '${fieldName}' is below the minimum of ${issue.minimum}.`;
  },
  
  too_big: (path, issue) => {
    const fieldName = formatFieldName(path);
    
    if (issue.type === 'string') {
      return `Value for '${fieldName}' is too long. Maximum length is ${issue.maximum} characters.`;
    }
    
    if (issue.type === 'array') {
      return `Array '${fieldName}' has too many items. Maximum allowed: ${issue.maximum}.`;
    }
    
    return `Value for '${fieldName}' exceeds the maximum of ${issue.maximum}.`;
  },
  
  invalid_enum_value: (path, issue) => {
    const fieldName = formatFieldName(path);
    const options = issue.options.join(', ');
    return `Invalid value for '${fieldName}'. Valid options are: ${options}.`;
  },
  
  invalid_union: (path, _issue) => {
    const fieldName = formatFieldName(path);
    return `Invalid value for '${fieldName}'. Please check the accepted formats for this parameter.`;
  },
  
  custom: (path, issue) => {
    const fieldName = formatFieldName(path);
    return issue.message || `Validation failed for '${fieldName}'.`;
  }
};

/**
 * Formats field names to be more user-friendly
 */
function formatFieldName(path: string): string {
  if (!path) return 'parameter';
  
  // Convert camelCase to readable format
  return path.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

/**
 * Formats type names to be more user-friendly
 */
function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'text',
    'number': 'number',
    'boolean': 'true/false value',
    'object': 'object',
    'array': 'array/list',
    'undefined': 'no value',
    'null': 'null'
  };
  
  return typeMap[type] || type;
}

/**
 * Converts a ZodError to user-friendly error messages
 */
export function formatZodError(error: ZodError): string {
  const issues = error.issues;
  
  if (issues.length === 0) {
    return 'Validation failed. Please check your input parameters.';
  }
  
  if (issues.length === 1) {
    const issue = issues[0];
    const path = issue.path.join('.');
    const formatter = ERROR_MESSAGE_MAP[issue.code];
    
    if (formatter) {
      return formatter(path, issue);
    }
    
    return `Validation error in '${formatFieldName(path)}': ${issue.message}`;
  }
  
  // Multiple issues - format as a list
  const messages = issues.map(issue => {
    const path = issue.path.join('.');
    const formatter = ERROR_MESSAGE_MAP[issue.code];
    
    if (formatter) {
      return `• ${formatter(path, issue)}`;
    }
    
    return `• ${formatFieldName(path)}: ${issue.message}`;
  });
  
  return `Multiple validation errors:\n${messages.join('\n')}`;
}

/**
 * Validates input with user-friendly error messages
 */
export function validateWithFriendlyErrors<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const friendlyMessage = formatZodError(error);
      const contextMessage = context ? `${context}: ${friendlyMessage}` : friendlyMessage;
      
      throw new EthersServerError(
        contextMessage,
        'VALIDATION_ERROR',
        { 
          validationErrors: error.issues,
          originalData: data 
        },
        400
      );
    }
    
    throw error;
  }
}

/**
 * Creates a parameter help message
 */
export function createParameterHelp(parameters: ParameterDescription[]): string {
  const required = parameters.filter(p => p.required);
  const optional = parameters.filter(p => !p.required);
  
  let help = '';
  
  if (required.length > 0) {
    help += 'Required parameters:\n';
    help += required.map(p => formatParameterHelp(p)).join('\n');
  }
  
  if (optional.length > 0) {
    if (help) help += '\n\n';
    help += 'Optional parameters:\n';
    help += optional.map(p => formatParameterHelp(p)).join('\n');
  }
  
  return help;
}

/**
 * Formats a single parameter description
 */
function formatParameterHelp(param: ParameterDescription): string {
  let help = `• ${param.name} (${param.type})`;
  
  if (param.description) {
    help += `: ${param.description}`;
  }
  
  if (param.format) {
    help += `\n  Format: ${param.format}`;
  }
  
  if (param.example) {
    help += `\n  Example: ${param.example}`;
  }
  
  return help;
}

/**
 * Common validation schemas with friendly error messages
 */
export const CommonSchemas = {
  /**
   * Ethereum address validation with helpful error message
   */
  ethereumAddress: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Invalid Ethereum address. Expected format: 0x followed by 40 hexadecimal characters (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7)'
  ),
  
  /**
   * Transaction hash validation
   */
  transactionHash: z.string().regex(
    /^0x[a-fA-F0-9]{64}$/,
    'Invalid transaction hash. Expected format: 0x followed by 64 hexadecimal characters'
  ),
  
  /**
   * Positive integer string (for amounts)
   */
  amountString: z.string().regex(
    /^\d+$/,
    'Invalid amount. Please provide a positive number as a string (e.g., "1000000000000000000" for 1 token with 18 decimals)'
  ),
  
  /**
   * Network name or RPC URL
   */
  provider: z.string().optional().describe(
    'Network name (e.g., "ethereum", "polygon") or custom RPC URL. Use getAllNetworks to see available options.'
  ),
  
  /**
   * Chain ID
   */
  chainId: z.number().optional().describe(
    'Blockchain network identifier (e.g., 1 for Ethereum mainnet, 137 for Polygon)'
  ),
  
  /**
   * Gas limit
   */
  gasLimit: z.union([z.string(), z.number()]).optional().describe(
    'Maximum gas units for transaction (e.g., "21000" for simple transfer)'
  ),
  
  /**
   * Gas price
   */
  gasPrice: z.union([z.string(), z.number()]).optional().describe(
    'Gas price in wei (e.g., "20000000000" for 20 gwei)'
  )
};

/**
 * Helper function to create consistent error responses
 */
export function createErrorResponse(error: unknown, operation?: string): { isError: true; content: Array<{ type: "text"; text: string }> } {
  let message: string;
  
  if (error instanceof EthersServerError) {
    message = error.message;
  } else if (error instanceof ZodError) {
    message = formatZodError(error);
  } else if (error instanceof Error) {
    // Check for common Ethereum errors and provide helpful messages
    if (error.message.includes('insufficient funds')) {
      message = 'Insufficient funds in wallet. Please ensure your wallet has enough ETH to cover the transaction and gas fees.';
    } else if (error.message.includes('nonce too low')) {
      message = 'Transaction nonce is too low. This usually means a transaction with this nonce was already mined. Try increasing the nonce.';
    } else if (error.message.includes('replacement fee too low')) {
      message = 'Cannot replace pending transaction. The new gas price must be at least 10% higher than the pending transaction.';
    } else if (error.message.includes('execution reverted')) {
      message = 'Transaction would fail. The contract rejected this operation. Common causes: insufficient token balance, missing approval, or contract-specific requirements not met.';
    } else if (error.message.includes('network does not support ENS')) {
      message = 'ENS (Ethereum Name Service) is not supported on this network. ENS is only available on Ethereum mainnet and some testnets.';
    } else if (error.message.includes('could not detect network')) {
      message = 'Unable to connect to the blockchain network. Please check your internet connection and ensure the RPC URL is correct and accessible.';
    } else if (error.message.includes('invalid address')) {
      message = 'Invalid Ethereum address provided. Addresses must start with 0x followed by 40 hexadecimal characters.';
    } else {
      message = error.message;
    }
  } else {
    message = String(error);
  }
  
  if (operation) {
    message = `Error during ${operation}: ${message}`;
  }
  
  return {
    isError: true,
    content: [{ 
      type: "text", 
      text: message
    }]
  };
}