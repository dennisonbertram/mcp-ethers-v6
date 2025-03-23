/**
 * @file MCP Client Tests Runner
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Test runner for MCP client tests specifically designed for Bun
 * 
 * IMPORTANT:
 * - Uses real MCP protocol over stdio
 * - Tests against actual server implementation
 * 
 * Functionality:
 * - Runs comprehensive MCP client tests
 * - Validates protocol communication
 * - Tests all exposed Ethereum tools
 */

import { McpStandardClient } from '../client/mcpStandardClient.js';
import { runTestSuites, formatTestResults } from '../client/utils/testRunner.js';
import { logger } from '../../utils/logger.js';
import { getBasicTests } from '../client/suites/basicTests.js';
import { getWalletTests } from '../client/suites/walletTests.js';
// Import additional test suites as they're implemented
import { getNetworkTests } from './suites/networkTests.js';
import { getBlockTests } from './suites/blockTests.js';
import { getTransactionTests } from './suites/transactionTests.js';
import { getUtilityTests } from './suites/utilityTests.js';
import { getContractTests } from './suites/contractTests.js';
import { getTokenTests } from './suites/tokenTests.js';
// import { generateTestReport } from './utils/reportGenerator.js';

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
    
    // Organize test suites
    const testSuites = new Map();
    
    // Add existing test suites
    testSuites.set('Basic', getBasicTests(client));
    testSuites.set('Wallet', getWalletTests(client));
    
    // Add new test suites
    testSuites.set('Network', getNetworkTests(client));
    testSuites.set('Block', getBlockTests(client));
    testSuites.set('Transaction', getTransactionTests(client));
    testSuites.set('Utility', getUtilityTests(client));
    testSuites.set('Contract', getContractTests(client));
    testSuites.set('Token', getTokenTests(client));
    
    // Run all test suites
    logger.info(`Running ${testSuites.size} test suites...`);
    const results = await runTestSuites(testSuites);
    
    // Format and display results
    for (const result of results) {
      console.log(formatTestResults(result));
    }
    
    // Generate a comprehensive test report
    // generateTestReport(results, 'mcp-client-tests');
    
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