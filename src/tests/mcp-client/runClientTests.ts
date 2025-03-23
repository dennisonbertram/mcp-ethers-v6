/**
 * @file MCP Client Tests Runner
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-09
 * 
 * Test runner for MCP client tests specifically designed for Bun
 * 
 * IMPORTANT:
 * - Uses real MCP protocol over stdio
 * - Tests against actual server implementation
 * - Supports network availability detection
 * 
 * Functionality:
 * - Runs comprehensive MCP client tests
 * - Validates protocol communication
 * - Tests all exposed Ethereum tools
 * - Tests cross-network functionality
 */

import { McpStandardClient } from '../client/mcpStandardClient.js';
import { runTestSuites, formatTestResults } from '../client/utils/testRunner.js';
import { logger } from '../../utils/logger.js';
import { getBasicTests } from '../client/suites/basicTests.js';
import { getWalletTests } from '../client/suites/walletTests.js';
// Import existing test suites
import { getNetworkTests } from './suites/networkTests.js';
import { getBlockTests } from './suites/blockTests.js';
import { getTransactionTests } from './suites/transactionTests.js';
import { getUtilityTests } from './suites/utilityTests.js';
import { getContractTests } from './suites/contractTests.js';
import { getTokenTests } from './suites/tokenTests.js';
// Import new test suites
import { getConnectionTests } from './suites/connectionTests.js';
import { getTransactionSendTests } from './suites/transactionSendTests.js';
import { getEnsTests } from './suites/ensTests.js';
import { getSignTests } from './suites/signTests.js';
// Import new network operations tests
import { getNetworkOperationsTests } from './suites/networkOperationsTests.js';
// Import network test utilities
import { determineAvailableNetworks } from './utils/networkTestSetup.js';
import { generateReports } from '../client/utils/reportGenerator.js';
import fs from 'fs';
import path from 'path';

/**
 * Main entry point for running MCP client tests
 */
async function main() {
  // Configure logging
  logger.info('Starting MCP client tests with Bun');
  
  let client: McpStandardClient | null = null;
  
  try {
    // Create the MCP client
    client = new McpStandardClient({
      serverCommand: 'node',
      serverArgs: ['build/src/mcpServer.js'],
      clientName: 'mcp-ethers-test-client',
      clientVersion: '1.0.0'
    });
    
    // Connect to the server
    logger.info('Connecting to MCP server...');
    await client.connect();
    logger.info('Connected to MCP server successfully');
    
    // Detect available networks for testing
    logger.info('Detecting available networks for cross-network testing...');
    const networkAvailability = await determineAvailableNetworks(client);
    
    // Log network availability status
    logger.info(`Network availability: ${networkAvailability.availableNetworks.length} available, ${networkAvailability.unavailableNetworks.length} unavailable`);
    logger.info(`Available networks: ${networkAvailability.availableNetworks.join(', ')}`);
    logger.info(`Available core networks: ${networkAvailability.availableCoreNetworks.join(', ')}`);
    
    if (!networkAvailability.hasMinimumNetworks) {
      logger.warn('Not enough networks available for cross-network testing. Some tests may be skipped.');
    }
    
    // Organize test suites
    const testSuites = new Map();
    
    // Add core functionality test suites
    testSuites.set('Connection', getConnectionTests(client));
    testSuites.set('Basic', getBasicTests(client));
    
    // Add wallet and transaction tests
    testSuites.set('Wallet', getWalletTests(client));
    testSuites.set('Transaction', getTransactionTests(client));
    testSuites.set('TransactionSend', getTransactionSendTests(client));
    
    // Add blockchain data tests
    testSuites.set('Network', getNetworkTests(client));
    testSuites.set('Block', getBlockTests(client));
    
    // Add utility tests
    testSuites.set('Utility', getUtilityTests(client));
    testSuites.set('ENS', getEnsTests(client));
    testSuites.set('Signature', getSignTests(client));
    
    // Add contract and token tests
    testSuites.set('Contract', getContractTests(client));
    testSuites.set('Token', getTokenTests(client));
    
    // Add new network operations tests
    if (networkAvailability.hasMinimumNetworks) {
      testSuites.set('NetworkOperations', getNetworkOperationsTests(client));
    } else {
      logger.warn('Skipping NetworkOperations tests due to insufficient network availability');
    }
    
    // Run all test suites
    logger.info(`Running ${testSuites.size} test suites...`);
    const results = await runTestSuites(testSuites);
    
    // Format and display results
    for (const result of results) {
      console.log(formatTestResults(result));
    }
    
    // Ensure reports directory exists
    const reportsDir = 'reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate a comprehensive test report
    generateReports(results, {
      jsonPath: 'reports/mcp-client-tests.json',
      htmlPath: 'reports/mcp-client-tests.html',
    });
    
    // Calculate overall success rate
    const totalTests = results.reduce((sum, suite) => sum + suite.passed.length + suite.failed.length, 0);
    const totalPassed = results.reduce((sum, suite) => sum + suite.passed.length, 0);
    const successRate = Math.round((totalPassed / totalTests) * 100);
    
    logger.info(`Test run complete. Overall success rate: ${successRate}% (${totalPassed}/${totalTests})`);
    
    // Return appropriate exit code
    process.exitCode = totalPassed === totalTests ? 0 : 1;
  } catch (error) {
    logger.error('Error running MCP client tests', { error });
    process.exitCode = 1;
  } finally {
    // Clean up resources
    if (client) {
      try {
        logger.info('Disconnecting from MCP server...');
        await client.disconnect();
        logger.info('Disconnected from MCP server successfully');
      } catch (error) {
        logger.error('Error disconnecting from MCP server', { error });
      }
    }
  }
}

// Run the tests
main().catch(error => {
  logger.error('Unhandled error in main', { error });
  process.exitCode = 1;
}); 