/**
 * @file Network Operations Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-09
 * 
 * Tests for cross-network operations
 * 
 * IMPORTANT:
 * - Tests behavior across multiple networks
 * - Validates network-specific functionality
 * - Requires at least two accessible networks
 * 
 * Functionality:
 * - Tests wallet balance across networks
 * - Tests gas price comparison between networks
 * - Tests block time differences between networks
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';
import { TEST_NETWORKS } from '../utils/networkTestConfig.js';
import { 
  determineAvailableNetworks, 
  extractTextFromResponse, 
  extractNumberFromText, 
  shouldSkipNetworkTest 
} from '../utils/networkTestSetup.js';

/**
 * Helper function to extract timestamp from block details text
 */
function extractTimestampFromBlockText(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const match = text.match(/timestamp[\":\s]+(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

/**
 * Helper function to extract price value from gas price text
 */
function extractGasPriceValue(text: string | undefined): { value: number; unit: string } | undefined {
  if (!text) return undefined;
  const match = text.match(/([\d\.]+)\s*(\w+)/i);
  return match ? { value: parseFloat(match[1]), unit: match[2].toLowerCase() } : undefined;
}

/**
 * Get the list of network operation tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getNetworkOperationsTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    {
      name: 'Get wallet balance across networks',
      test: async () => {
        // Determine which networks are available
        const { availableNetworks, hasMinimumNetworks } = 
          await determineAvailableNetworks(client);
        
        if (!hasMinimumNetworks) {
          logger.warn('Not enough networks available for cross-network testing, skipping test');
          return;
        }
        
        // Filter to networks with test addresses
        const networksWithAddresses = availableNetworks.filter(
          name => TEST_NETWORKS[name].testAddress
        );
        
        if (networksWithAddresses.length < 2) {
          logger.warn('Not enough networks with test addresses available, skipping test');
          return;
        }
        
        // Check balances across networks
        const balances = [];
        
        for (const networkName of networksWithAddresses) {
          const config = TEST_NETWORKS[networkName];
          try {
            if (!config.testAddress) continue;
            
            logger.info(`Checking balance on ${networkName} for ${config.testAddress}`);
            
            const result = await client.callTool('getWalletBalance', {
              address: config.testAddress,
              provider: config.rpcName
            });
            
            assertToolSuccess(result, `Failed to get balance on ${networkName}`);
            const balanceText = extractTextFromResponse(result);
            
            // Verify it contains a number
            assert(
              balanceText !== undefined && /[\d\.]+/.test(balanceText),
              `Balance response on ${networkName} does not contain a number: ${balanceText}`
            );
            
            // Extract the balance value
            const match = balanceText?.match(/([\d\.]+)/);
            const balanceValue = match ? parseFloat(match[1]) : 0;
            
            balances.push({
              network: networkName,
              value: balanceValue,
              currency: config.expectedCurrency,
              text: balanceText
            });
            
            logger.info(`Balance on ${networkName}: ${balanceText}`);
          } catch (error) {
            logger.warn(`Failed to get balance for ${networkName}`, { error });
          }
        }
        
        // Ensure we got balances from at least 2 networks
        assert(balances.length >= 2, 'Failed to get balances from multiple networks');
        logger.info('Successfully retrieved balances from multiple networks', { balances });
      }
    },
    
    {
      name: 'Get gas prices across networks',
      test: async () => {
        // Determine which networks are available
        const { availableNetworks, hasMinimumNetworks } = 
          await determineAvailableNetworks(client);
        
        if (!hasMinimumNetworks) {
          logger.warn('Not enough networks available for cross-network testing, skipping test');
          return;
        }
        
        // Check gas prices across networks
        const gasPrices = [];
        
        for (const networkName of availableNetworks) {
          const config = TEST_NETWORKS[networkName];
          try {
            logger.info(`Checking gas price on ${networkName}`);
            
            const result = await client.callTool('getGasPrice', {
              provider: config.rpcName
            });
            
            assertToolSuccess(result, `Failed to get gas price on ${networkName}`);
            const gasPriceText = extractTextFromResponse(result);
            
            // Extract gas price value
            const gasPrice = extractGasPriceValue(gasPriceText);
            
            if (gasPrice) {
              gasPrices.push({
                network: networkName,
                value: gasPrice.value,
                unit: gasPrice.unit,
                text: gasPriceText
              });
              
              logger.info(`Gas price on ${networkName}: ${gasPriceText}`);
            } else {
              logger.warn(`Could not extract gas price from response: ${gasPriceText}`);
            }
          } catch (error) {
            logger.warn(`Failed to get gas price for ${networkName}`, { error });
          }
        }
        
        // Ensure we got gas prices from at least 2 networks
        assert(gasPrices.length >= 2, 'Failed to get gas prices from multiple networks');
        
        // Log gas price differences
        for (let i = 0; i < gasPrices.length; i++) {
          for (let j = i + 1; j < gasPrices.length; j++) {
            const a = gasPrices[i];
            const b = gasPrices[j];
            
            // Only compare if units match
            if (a.unit === b.unit) {
              const difference = Math.abs(a.value - b.value);
              const percentDiff = (difference / Math.max(a.value, b.value)) * 100;
              
              logger.info(`Gas price difference between ${a.network} and ${b.network}: ${difference} ${a.unit} (${percentDiff.toFixed(2)}%)`);
            }
          }
        }
        
        logger.info('Successfully compared gas prices across networks', { gasPrices });
      }
    },
    
    {
      name: 'Compare block times across networks',
      test: async () => {
        // Determine which networks are available
        const { availableNetworks, hasMinimumNetworks } = 
          await determineAvailableNetworks(client);
        
        if (!hasMinimumNetworks) {
          logger.warn('Not enough networks available for cross-network testing, skipping test');
          return;
        }
        
        // Calculate block times across networks
        const blockTimes = [];
        
        for (const networkName of availableNetworks) {
          const config = TEST_NETWORKS[networkName];
          try {
            logger.info(`Analyzing block time on ${networkName}`);
            
            // Get latest block
            const blockResult = await client.callTool('getBlockDetails', {
              blockTag: 'latest',
              provider: config.rpcName
            });
            
            assertToolSuccess(blockResult, `Failed to get latest block on ${networkName}`);
            const blockText = extractTextFromResponse(blockResult);
            
            // Extract block number from latest block
            const blockNumberMatch = blockText?.match(/"number":\s*(\d+)/);
            const latestBlockNumber = blockNumberMatch ? parseInt(blockNumberMatch[1]) : undefined;
            
            if (!latestBlockNumber) {
              logger.warn(`Could not extract block number from latest block on ${networkName}`);
              continue;
            }
            
            // Get previous block using explicit block number
            const prevBlockResult = await client.callTool('getBlockDetails', {
              blockTag: String(latestBlockNumber - 1), // Convert to string for the API
              provider: config.rpcName
            });
            
            assertToolSuccess(prevBlockResult, `Failed to get previous block on ${networkName}`);
            const prevBlockText = extractTextFromResponse(prevBlockResult);
            
            // Extract timestamps
            const latestTime = extractTimestampFromBlockText(blockText);
            const prevTime = extractTimestampFromBlockText(prevBlockText);
            
            if (latestTime && prevTime) {
              const blockTime = latestTime - prevTime;
              blockTimes.push({
                network: networkName,
                blockTime,
                latestTime,
                prevTime
              });
              
              // Verify block time is within expected range if available
              if (config.expectedBlockTimeRange) {
                const [min, max] = config.expectedBlockTimeRange;
                
                // Log but don't fail if outside range (network conditions vary)
                if (blockTime < min || blockTime > max) {
                  logger.warn(`Block time for ${networkName} (${blockTime}s) outside expected range (${min}-${max}s)`);
                } else {
                  logger.info(`Block time for ${networkName} (${blockTime}s) within expected range (${min}-${max}s)`);
                }
              }
            } else {
              logger.warn(`Could not extract timestamps from blocks on ${networkName}`);
            }
          } catch (error) {
            logger.warn(`Failed to analyze block time for ${networkName}`, { error });
          }
        }
        
        // Ensure we got block times from at least 2 networks
        assert(blockTimes.length >= 2, 'Failed to get block times from multiple networks');
        
        // Compare block times between networks
        logger.info('Block times across networks', { blockTimes });
        
        // Sort networks by block time (fastest to slowest)
        blockTimes.sort((a, b) => a.blockTime - b.blockTime);
        
        logger.info('Networks sorted by block time (fastest to slowest)', {
          networks: blockTimes.map(bt => ({
            network: bt.network,
            blockTime: `${bt.blockTime}s`
          }))
        });
      }
    },
    
    {
      name: 'Rapid network switching test',
      test: async () => {
        // Determine which networks are available
        const { availableNetworks, hasMinimumNetworks } = 
          await determineAvailableNetworks(client);
        
        if (!hasMinimumNetworks) {
          logger.warn('Not enough networks available for network switching test, skipping test');
          return;
        }
        
        if (availableNetworks.length < 3) {
          logger.warn('Need at least 3 networks for rapid switching test, skipping test');
          return;
        }
        
        // Select 3 networks for testing
        const testNetworks = availableNetworks.slice(0, 3);
        
        // Test rapidly switching between networks
        const results = [];
        
        // First round: get block numbers in sequence
        for (const networkName of testNetworks) {
          const config = TEST_NETWORKS[networkName];
          const result = await client.callTool('getBlockNumber', {
            provider: config.rpcName
          });
          
          assertToolSuccess(result, `Failed to get block number on ${networkName} (round 1)`);
          const blockNumber = extractNumberFromText(extractTextFromResponse(result));
          
          results.push({
            round: 1,
            network: networkName,
            blockNumber
          });
        }
        
        // Second round: get block numbers in reverse sequence
        for (const networkName of [...testNetworks].reverse()) {
          const config = TEST_NETWORKS[networkName];
          const result = await client.callTool('getBlockNumber', {
            provider: config.rpcName
          });
          
          assertToolSuccess(result, `Failed to get block number on ${networkName} (round 2)`);
          const blockNumber = extractNumberFromText(extractTextFromResponse(result));
          
          results.push({
            round: 2,
            network: networkName,
            blockNumber
          });
        }
        
        // Third round: get block numbers in alternating sequence
        const shuffled = [...testNetworks].sort(() => Math.random() - 0.5);
        
        for (const networkName of shuffled) {
          const config = TEST_NETWORKS[networkName];
          const result = await client.callTool('getBlockNumber', {
            provider: config.rpcName
          });
          
          assertToolSuccess(result, `Failed to get block number on ${networkName} (round 3)`);
          const blockNumber = extractNumberFromText(extractTextFromResponse(result));
          
          results.push({
            round: 3,
            network: networkName,
            blockNumber
          });
        }
        
        // Verify all operations completed successfully
        assert(results.length === testNetworks.length * 3, 'Not all network operations completed');
        
        // Verify that block numbers are increasing or equal for each network across rounds
        for (const networkName of testNetworks) {
          const networkResults = results.filter(r => r.network === networkName);
          
          for (let i = 1; i < networkResults.length; i++) {
            const prev = networkResults[i-1];
            const curr = networkResults[i];
            
            assert(
              curr.blockNumber !== undefined && 
              prev.blockNumber !== undefined &&
              curr.blockNumber >= prev.blockNumber,
              `Block number decreased for ${networkName} between rounds`
            );
          }
        }
        
        logger.info('Successfully completed rapid network switching test', { results });
      }
    }
  ];
} 