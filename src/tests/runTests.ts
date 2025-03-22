#!/usr/bin/env node

/**
 * @file MCP Test Runner
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Main test runner for MCP ethers server tests
 * 
 * IMPORTANT:
 * - Handles client lifecycle
 * - Runs configured test suites
 * - Generates test reports
 * 
 * Functionality:
 * - Command-line test selection
 * - Configurable test options
 * - Report generation
 */

import { McpStandardClient } from './client/mcpStandardClient.js';
import { getBasicTests } from './client/suites/basicTests.js';
import { getWalletTests } from './client/suites/walletTests.js';
import { runTests, TestSuiteResult } from './client/utils/testRunner.js';
import { generateReports } from './client/utils/reportGenerator.js';
import { logger } from '../utils/logger.js';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Main test execution function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const testSuite = process.argv[2] || 'all';
  const reportDir = process.argv[3] || 'reports';
  
  logger.info(`Starting MCP test runner with suite: ${testSuite}`);
  
  // Initialize the client
  const client = new McpStandardClient({
    serverCommand: 'node',
    serverArgs: ['build/index.js'],
    clientName: 'mcp-ethers-test-client',
    clientVersion: '1.0.0'
  });
  
  try {
    // Connect to the server
    logger.info('Connecting to MCP server...');
    await client.connect();
    
    // Store test results
    const results: TestSuiteResult[] = [];
    
    // Run the selected test suite(s)
    switch (testSuite.toLowerCase()) {
      case 'basic':
        results.push(await runTests('Basic Tests', getBasicTests(client)));
        break;
        
      case 'wallet':
        results.push(await runTests('Wallet Tests', getWalletTests(client)));
        break;
        
      case 'all':
        // Run all test suites
        results.push(await runTests('Basic Tests', getBasicTests(client)));
        results.push(await runTests('Wallet Tests', getWalletTests(client)));
        
        // Add more test suites as they're implemented
        // results.push(await runTests('ERC20 Tests', getErc20Tests(client)));
        // results.push(await runTests('ERC721 Tests', getErc721Tests(client)));
        break;
        
      default:
        logger.error(`Unknown test suite: ${testSuite}`);
        logger.info('Available suites: basic, wallet, all');
        process.exit(1);
    }
    
    // Generate reports
    await generateReports(results, {
      jsonPath: `${reportDir}/mcp-test-report.json`,
      htmlPath: `${reportDir}/mcp-test-report.html`,
    });
    
    // Calculate overall success
    const totalTests = results.reduce((sum, suite) => 
      sum + suite.passed.length + suite.failed.length, 0);
    const failedTests = results.reduce((sum, suite) => 
      sum + suite.failed.length, 0);
    
    logger.info(`Test run complete. ${totalTests - failedTests}/${totalTests} tests passed.`);
    
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    logger.error('Test run failed', { error });
    process.exit(1);
  } finally {
    // Always disconnect the client
    try {
      await client.disconnect();
    } catch (error) {
      logger.error('Error disconnecting client', { error });
    }
  }
}

// Execute the main function
main().catch(error => {
  logger.error('Unhandled error in test runner', { error });
  process.exit(1);
}); 