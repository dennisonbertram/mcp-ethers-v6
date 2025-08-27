/**
 * @file Parameter Mapping Utility
 * @version 1.0.0
 * 
 * Provides backward compatibility for parameter name changes
 * Maps deprecated parameter names to standardized names
 */

import { silentLogger } from './silentLogger.js';

/**
 * Parameter name mappings from old to new
 */
const PARAMETER_MAPPINGS: Record<string, string> = {
  // Address mappings
  tokenAddress: 'contractAddress',
  walletAddress: 'address',
  
  // No changes needed for these (already standard):
  // ownerAddress, spenderAddress, fromAddress, toAddress, operatorAddress
  // amount, value, provider, chainId, blockNumber, fromBlock, toBlock, blockHash
};

/**
 * Maps deprecated parameter names to standardized names
 * Provides backward compatibility for existing integrations
 * 
 * @param params The parameters object with potentially deprecated names
 * @returns A new object with standardized parameter names
 */
export function mapParameters<T extends Record<string, any>>(params: T): T {
  const mapped = { ...params };
  let hasDeprecated = false;
  
  for (const [oldName, newName] of Object.entries(PARAMETER_MAPPINGS)) {
    if (oldName in params && !(newName in params)) {
      mapped[newName] = params[oldName];
      delete mapped[oldName];
      hasDeprecated = true;
      
      // Log deprecation warning
      silentLogger.warn(`Parameter '${oldName}' is deprecated. Please use '${newName}' instead.`);
    }
  }
  
  // If both old and new names are present, use the new name and warn
  for (const [oldName, newName] of Object.entries(PARAMETER_MAPPINGS)) {
    if (oldName in params && newName in params) {
      delete mapped[oldName];
      silentLogger.warn(`Both '${oldName}' and '${newName}' provided. Using '${newName}' (${oldName} is deprecated).`);
    }
  }
  
  return mapped;
}

/**
 * Validates that required parameters are present after mapping
 * 
 * @param params The mapped parameters
 * @param required Array of required parameter names
 * @throws Error if required parameters are missing
 */
export function validateRequiredParameters(
  params: Record<string, any>,
  required: string[]
): void {
  const missing = required.filter(name => !(name in params));
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Helper to check if a parameter name is deprecated
 * 
 * @param paramName The parameter name to check
 * @returns True if the parameter name is deprecated
 */
export function isDeprecatedParameter(paramName: string): boolean {
  return paramName in PARAMETER_MAPPINGS;
}

/**
 * Gets the standardized name for a potentially deprecated parameter
 * 
 * @param paramName The parameter name (old or new)
 * @returns The standardized parameter name
 */
export function getStandardParameterName(paramName: string): string {
  return PARAMETER_MAPPINGS[paramName] || paramName;
}