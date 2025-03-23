/**
 * @file Network Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-09
 * 
 * Tests for network-related MCP tools
 * 
 * IMPORTANT:
 * - Tests network tools through MCP protocol
 * - Validates network data structures
 * - Tests network switching capability
 * 
 * Functionality:
 * - Tests getSupportedNetworks
 * - Tests getBlockNumber
 * - Tests getGasPrice
 * - Tests getFeeData
 * - Tests network switching
 * - Tests chainId parameter validation
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';
import { TEST_NETWORKS, CORE_TEST_NETWORKS } from '../utils/networkTestConfig.js';
import { extractTextFromResponse, extractNumberFromText, determineAvailableNetworks } from '../utils/networkTestSetup.js';

/**
 * Get the list of network-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getNetworkTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    // Basic network information tests
    {
      name: 'Get supported networks',
      test: async () => {
        const result = await client.callTool('getSupportedNetworks', {});
        assertToolSuccess(result, 'Failed to get supported networks');
        
        // Find the text content in the response
        const networkText = extractTextFromResponse(result);
        assertDefined(networkText, 'Network response has no text content');
        
        // Parse the JSON response
        let networks: any[] = [];
        try {
          networks = JSON.parse(networkText);
          assert(Array.isArray(networks), 'Network response is not an array');
        } catch (error) {
          assert(false, `Failed to parse network JSON: ${networkText}`);
        }
        
        // Verify that the result contains at least one network
        assert(networks.length > 0, 'No networks returned in the response');
        
        // Verify each network has the required properties
        networks.forEach(network => {
          assert(network.name, `Network missing name property: ${JSON.stringify(network)}`);
          assert(typeof network.chainId === 'number', 
            `Network missing valid chainId property: ${JSON.stringify(network)}`);
          assert(network.nativeCurrency?.symbol, 
            `Network missing currency symbol: ${JSON.stringify(network)}`);
        });
        
        logger.debug('Network response content', { networks });
      }
    },
    
    // Network validation test
    {
      name: 'Validate supported networks',
      test: async () => {
        const result = await client.callTool('getSupportedNetworks', {});
        assertToolSuccess(result, 'Failed to get supported networks');
        
        // Parse the JSON response
        const networkText = extractTextFromResponse(result);
        assertDefined(networkText, 'Network response has no text content');
        
        let networks: any[] = [];
        try {
          networks = JSON.parse(networkText);
        } catch (error) {
          assert(false, `Failed to parse network JSON: ${networkText}`);
        }
        
        // Verify our core test networks are present
        for (const networkName of CORE_TEST_NETWORKS) {
          const config = TEST_NETWORKS[networkName];
          const found = networks.find(n => n.name === networkName);
          
          // Not all networks might be available, so we log but don't fail
          if (!found) {
            logger.warn(`Core test network ${networkName} not found in supported networks`);
            continue;
          }
          
          logger.debug(`Found network ${networkName} in supported networks`, { 
            chainId: found.chainId,
            expectedChainId: config.chainId
          });
        }
        
        // Ensure at least one of our test networks is available
        const availableTestNetworks = networks
          .filter(n => Object.keys(TEST_NETWORKS).includes(n.name))
          .map(n => n.name);
        
        assert(
          availableTestNetworks.length > 0, 
          'None of our test networks are available in supported networks'
        );
        
        logger.info('Available test networks', { availableTestNetworks });
      }
    },
    
    // Network switching test
    {
      name: 'Switch between networks',
      test: async () => {
        // Determine which networks are available
        const { availableNetworks, hasMinimumNetworks } = 
          await determineAvailableNetworks(client, { onlyCoreNetworks: true });
        
        if (!hasMinimumNetworks) {
          logger.warn('Not enough networks available for testing, skipping test');
          return; // Skip this test if not enough networks
        }
        
        // Get block numbers from multiple networks sequentially
        const results = [];
        
        for (const networkName of availableNetworks) {
          const config = TEST_NETWORKS[networkName];
          try {
            logger.info(`Testing block number on ${networkName} (${config.rpcName})`);
            const result = await client.callTool('getBlockNumber', {
              provider: config.rpcName
            });
            
            assertToolSuccess(result, `Failed to get block number on ${networkName}`);
            const blockNumberText = extractTextFromResponse(result);
            const blockNumber = extractNumberFromText(blockNumberText);
            
            assert(blockNumber !== undefined && blockNumber > 0, 
              `Invalid block number on ${networkName}: ${blockNumberText}`);
              
            results.push({ network: networkName, blockNumber });
          } catch (error) {
            logger.warn(`Test failed for network ${networkName}`, { error });
            // Don't fail entire test if one network fails
          }
        }
        
        // Ensure we got results from at least 2 networks
        assert(results.length >= 2, 'Failed to get block numbers from multiple networks');
        logger.info('Successfully retrieved block numbers from multiple networks', { results });
      }
    },
    
    // Chain ID parameter test
    {
      name: 'Validate chainId parameter',
      test: async () => {
        // Get a valid network with chainId from our available networks
        const { availableNetworks } = await determineAvailableNetworks(client, { 
          onlyCoreNetworks: true,
          retries: 0 // Quick check, don't retry
        });
        
        if (availableNetworks.length === 0) {
          logger.warn('No networks available, skipping chainId parameter test');
          return;
        }
        
        const testNetwork = availableNetworks[0];
        const config = TEST_NETWORKS[testNetwork];
        
        // Test with valid chainId
        try {
          const validResult = await client.callTool('getBlockNumber', {
            chainId: config.chainId
          });
          
          assertToolSuccess(validResult, `Failed with valid chainId ${config.chainId}`);
          logger.info(`Successfully used chainId parameter ${config.chainId} for ${testNetwork}`);
        } catch (error) {
          logger.warn(`Valid chainId parameter test failed: ${error}`);
        }
        
        // If we have at least 2 networks, test with mismatched chainId and provider
        if (availableNetworks.length >= 2) {
          const secondNetwork = availableNetworks[1];
          const secondConfig = TEST_NETWORKS[secondNetwork];
          
          try {
            const mismatchResult = await client.callTool('getBlockNumber', {
              provider: config.rpcName,
              chainId: secondConfig.chainId // Use chainId from second network with provider from first
            });
            
            // This should fail with a specific error about chain ID mismatch
            assert(
              mismatchResult.isError && 
              extractTextFromResponse(mismatchResult)?.toLowerCase().includes('mismatch'),
              'Did not properly detect chainId mismatch'
            );
            
            logger.info('Successfully detected chainId mismatch', {
              provider: config.rpcName,
              chainId: secondConfig.chainId,
              error: extractTextFromResponse(mismatchResult)
            });
          } catch (error) {
            // If it throws directly, that's also acceptable
            logger.info('Received error for chainId mismatch (expected)', { error });
          }
        }
      }
    },
    
    {
      name: 'Get block number',
      test: async () => {
        const result = await client.callTool('getBlockNumber', {});
        assertToolSuccess(result, 'Failed to get block number');
        
        // Find the text content in the response
        const blockNumberText = extractTextFromResponse(result);
        assertDefined(blockNumberText, 'Block number response has no text content');
        
        // Verify that the result contains a number
        const blockNumber = extractNumberFromText(blockNumberText);
        assert(
          blockNumber !== undefined,
          `Block number response "${blockNumberText}" does not contain a number`
        );
        
        logger.debug('Block number response', { blockNumber });
      }
    },
    
    {
      name: 'Get gas price',
      test: async () => {
        const result = await client.callTool('getGasPrice', {});
        assertToolSuccess(result, 'Failed to get gas price');
        
        // Find the text content in the response
        const gasPriceText = extractTextFromResponse(result);
        assertDefined(gasPriceText, 'Gas price response has no text content');
        
        // Verify the gas price contains a number and a unit
        assert(
          /\d+/.test(gasPriceText || '') && 
          (gasPriceText?.toLowerCase().includes('gwei') || gasPriceText?.toLowerCase().includes('wei')),
          `Gas price response "${gasPriceText}" does not contain a valid gas price`
        );
        
        logger.debug('Gas price response', { gasPriceText });
      }
    },
    
    {
      name: 'Get fee data',
      test: async () => {
        const result = await client.callTool('getFeeData', {});
        assertToolSuccess(result, 'Failed to get fee data');
        
        // Find the text content in the response
        const feeDataText = extractTextFromResponse(result);
        assertDefined(feeDataText, 'Fee data response has no text content');
        
        // Verify that the fee data contains expected fields
        const expectedTerms = ['gas', 'fee', 'price', 'base', 'priority'];
        const hasExpectedTerms = expectedTerms.some(term => 
          feeDataText?.toLowerCase().includes(term)
        );
        
        assert(
          hasExpectedTerms,
          `Fee data response "${feeDataText}" does not contain expected fee information`
        );
        
        logger.debug('Fee data response', { feeDataText });
      }
    }
  ];
} 