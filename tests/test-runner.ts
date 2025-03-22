/**
 * @file Test Runner
 * @version 1.0.0
 * @status TEST
 * 
 * Command-line test runner for MCP tools
 */

import { testCoreTools } from './tools/core-tools-test.js';
import { testERC20Tools } from './tools/erc20-test.js';
import { testNFTTools } from './tools/nft-tools-test.js';
import { getTestReport } from './report-generation.js';
import { validateAlchemyKey } from './validate-alchemy-key.js';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config();

// Safe logging functions that write to stderr to avoid interfering with MCP protocol
function log(message: string): void {
  process.stderr.write(message + '\n');
}

function logError(message: string): void {
  process.stderr.write(`ERROR: ${message}\n`);
}

// Check if Alchemy API key is set
async function validateEnvironment() {
  if (!process.env.ALCHEMY_API_KEY) {
    logError('❌ ALCHEMY_API_KEY is not defined in your .env file');
    logError('Please add your Alchemy API key to the .env file: ALCHEMY_API_KEY=your_api_key');
    process.exit(1);
  }
  
  log('✅ ALCHEMY_API_KEY found in .env file');
  log(`API Key: ${process.env.ALCHEMY_API_KEY.substring(0, 6)}...${process.env.ALCHEMY_API_KEY.substring(process.env.ALCHEMY_API_KEY.length - 4)}`);
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    logError('❌ .env file not found');
    logError('Please create a .env file with your ALCHEMY_API_KEY');
    process.exit(1);
  }
  
  // Validate the Alchemy API key by making a direct API call
  try {
    await validateAlchemyKey();
  } catch (error) {
    logError('❌ Failed to validate Alchemy API key.');
    logError('Please check your key and make sure it is active.');
    process.exit(1);
  }
}

// Available test suites
const testSuites: Record<string, () => Promise<void>> = {
  'core': testCoreTools,
  'erc20': testERC20Tools,
  'nft': testNFTTools,
  'all': async () => {
    await testCoreTools();
    await testERC20Tools();
    await testNFTTools();
  }
};

// Get command line arguments
const args = process.argv.slice(2);
const testSuite = args[0] || 'all';
const reportPath = args[1] || 'mcp-test-report.md';

// Initialize the test report
getTestReport(reportPath);

// Check if the requested test suite exists
if (!testSuites[testSuite]) {
  logError(`Error: Unknown test suite "${testSuite}"`);
  logError('Available test suites:');
  Object.keys(testSuites).forEach(name => {
    logError(`  - ${name}`);
  });
  process.exit(1);
}

log(`Running test suite: ${testSuite}`);
log(`Report will be generated at: ${reportPath}`);
log('-'.repeat(60));

// Validate environment and then run the test suite
validateEnvironment()
  .then(() => {
    return testSuites[testSuite]();
  })
  .then(() => {
    log('-'.repeat(60));
    log(`Test suite "${testSuite}" completed.`);
    log(`See report at: ${reportPath}`);
  })
  .catch(error => {
    logError(`Error running test suite "${testSuite}": ${error}`);
    process.exit(1);
  }); 