/**
 * @file Network Test Setup Utilities
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-09
 * 
 * Utilities for setting up and managing network tests
 * 
 * IMPORTANT:
 * - Handle network connectivity failures gracefully
 * - Provide clear diagnostics for test setup issues
 * 
 * Functionality:
 * - Determine available networks for testing
 * - Extract data from tool responses
 * - Manage network test execution
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { logger } from '../../../utils/logger.js';
import { TEST_NETWORKS, CORE_TEST_NETWORKS } from './networkTestConfig.js';

/**
 * Response from a network availability check
 */
export interface NetworkAvailabilityResult {
  /** Networks available for testing */
  availableNetworks: string[];
  /** Networks from the core set that are available */
  availableCoreNetworks: string[];
  /** Networks that failed connection tests */
  unavailableNetworks: string[];
  /** Whether the minimum required networks are available */
  hasMinimumNetworks: boolean;
}

/**
 * Options for network availability check
 */
export interface NetworkAvailabilityOptions {
  /** Retry count for network connection attempts */
  retries?: number;
  /** Timeout in ms for each connection attempt */
  timeout?: number;
  /** Whether to check only core networks */
  onlyCoreNetworks?: boolean;
  /** Whether to require API keys for networks that need them */
  requireApiKeys?: boolean;
}

/**
 * Determine which networks are available for testing
 * 
 * @param client MCP client to use for testing
 * @param options Options for the availability check
 * @returns Information about available networks
 */
export async function determineAvailableNetworks(
  client: McpStandardClient,
  options: NetworkAvailabilityOptions = {}
): Promise<NetworkAvailabilityResult> {
  const {
    retries = 1,
    timeout = 5000,
    onlyCoreNetworks = false,
    requireApiKeys = false
  } = options;

  logger.info('Determining available networks for testing', { onlyCoreNetworks });
  
  try {
    // Get list of supported networks from the server
    const result = await client.callTool('getSupportedNetworks', {});
    if (!result || result.isError) {
      logger.warn('Failed to get supported networks', { error: result?.content?.[0]?.text });
      return {
        availableNetworks: [],
        availableCoreNetworks: [],
        unavailableNetworks: Object.keys(TEST_NETWORKS),
        hasMinimumNetworks: false
      };
    }
    
    // Parse network data from response
    const networkText = result.content.find((item: { type: string; text?: string }) => item.type === 'text')?.text || '';
    const networks: Array<{ name: string; chainId?: number }> = [];
    
    try {
      const parsedNetworks = JSON.parse(networkText);
      if (Array.isArray(parsedNetworks)) {
        networks.push(...parsedNetworks);
      }
    } catch (error) {
      logger.warn('Failed to parse networks JSON', { networkText, error });
    }
    
    // Log supported networks
    logger.debug('Server reports these supported networks', { 
      networks: networks.map(n => n.name) 
    });
    
    // Select networks to test from our configuration
    const networksToTest = onlyCoreNetworks
      ? CORE_TEST_NETWORKS
      : Object.keys(TEST_NETWORKS);
    
    // Verify each network in our test list is actually accessible
    const availableNetworks: string[] = [];
    const unavailableNetworks: string[] = [];
    
    for (const networkName of networksToTest) {
      const config = TEST_NETWORKS[networkName];
      
      // Skip networks requiring API keys if we don't want to require them
      if (!requireApiKeys && config.requiresApiKey) {
        logger.debug(`Skipping ${networkName} as it requires API keys and requireApiKeys=false`);
        unavailableNetworks.push(networkName);
        continue;
      }
      
      // Check if the server knows about this network
      const serverHasNetwork = networks.some(n => n.name === networkName);
      if (!serverHasNetwork) {
        logger.debug(`Server doesn't support network ${networkName}`);
        unavailableNetworks.push(networkName);
        continue;
      }
      
      // Test network connection by getting block number
      let isAvailable = false;
      let attemptCount = 0;
      
      while (!isAvailable && attemptCount <= retries) {
        attemptCount++;
        try {
          const blockResult = await Promise.race([
            client.callTool('getBlockNumber', { provider: config.rpcName }),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Network connection timeout')), timeout)
            )
          ]);
          
          if (blockResult && !blockResult.isError) {
            isAvailable = true;
            availableNetworks.push(networkName);
            logger.debug(`Network ${networkName} is available (attempt ${attemptCount})`);
          } else {
            logger.debug(`Failed to connect to ${networkName} (attempt ${attemptCount}): ${blockResult?.content?.[0]?.text}`);
          }
        } catch (error) {
          logger.debug(`Error testing ${networkName} (attempt ${attemptCount})`, { error });
        }
      }
      
      if (!isAvailable) {
        unavailableNetworks.push(networkName);
      }
    }
    
    // Determine which core networks are available
    const availableCoreNetworks = availableNetworks.filter(n => CORE_TEST_NETWORKS.includes(n));
    
    // Need at least 2 networks for cross-network testing
    const hasMinimumNetworks = availableNetworks.length >= 2;
    
    logger.info(`Network availability check complete: ${availableNetworks.length} available, ${unavailableNetworks.length} unavailable`, {
      available: availableNetworks,
      unavailable: unavailableNetworks,
      coreAvailable: availableCoreNetworks
    });
    
    return {
      availableNetworks,
      availableCoreNetworks,
      unavailableNetworks,
      hasMinimumNetworks
    };
  } catch (error) {
    logger.error('Error determining available networks', { error });
    return {
      availableNetworks: [],
      availableCoreNetworks: [],
      unavailableNetworks: Object.keys(TEST_NETWORKS),
      hasMinimumNetworks: false
    };
  }
}

/**
 * Extract a text value from a tool response
 * 
 * @param result Tool response from MCP call
 * @returns The text content or undefined if not found
 */
export function extractTextFromResponse(
  result: { content: Array<{ type: string; text?: string }> } | undefined
): string | undefined {
  if (!result) return undefined;
  return result.content.find(item => item.type === 'text')?.text;
}

/**
 * Extract a number from a tool response text using a regex pattern
 * 
 * @param text Text to extract a number from
 * @param pattern Regex pattern to match the number (defaults to any number)
 * @returns The extracted number or undefined if not found
 */
export function extractNumberFromText(
  text: string | undefined, 
  pattern: RegExp = /\d+/
): number | undefined {
  if (!text) return undefined;
  const match = text.match(pattern);
  return match ? Number(match[0]) : undefined;
}

/**
 * Skip test if networks are not available
 * 
 * @param availableNetworks List of available networks
 * @param requiredNetworks Networks required for this test
 * @returns True if test should be skipped
 */
export function shouldSkipNetworkTest(
  availableNetworks: string[],
  requiredNetworks: string[] = []
): boolean {
  if (requiredNetworks.length === 0) {
    // Need at least 2 networks for cross-network testing
    return availableNetworks.length < 2;
  }
  
  // Check if all required networks are available
  return !requiredNetworks.every(network => availableNetworks.includes(network));
} 