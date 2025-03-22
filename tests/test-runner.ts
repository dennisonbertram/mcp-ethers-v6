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

// Check if Alchemy API key is set
async function validateEnvironment() {
  if (!process.env.ALCHEMY_API_KEY) {
    console.error('❌ ALCHEMY_API_KEY is not defined in your .env file');
    console.error('Please add your Alchemy API key to the .env file: ALCHEMY_API_KEY=your_api_key');
    process.exit(1);
  }
  
  console.log('✅ ALCHEMY_API_KEY found in .env file');
  console.log(`API Key: ${process.env.ALCHEMY_API_KEY.substring(0, 6)}...${process.env.ALCHEMY_API_KEY.substring(process.env.ALCHEMY_API_KEY.length - 4)}`);
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found');
    console.error('Please create a .env file with your ALCHEMY_API_KEY');
    process.exit(1);
  }
  
  // Validate the Alchemy API key by making a direct API call
  try {
    await validateAlchemyKey();
  } catch (error) {
    console.error('❌ Failed to validate Alchemy API key.');
    console.error('Please check your key and make sure it is active.');
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
  console.error(`Error: Unknown test suite "${testSuite}"`);
  console.error('Available test suites:');
  Object.keys(testSuites).forEach(name => {
    console.error(`  - ${name}`);
  });
  process.exit(1);
}

console.log(`Running test suite: ${testSuite}`);
console.log(`Report will be generated at: ${reportPath}`);
console.log('-'.repeat(60));

// Validate environment and then run the test suite
validateEnvironment()
  .then(() => {
    return testSuites[testSuite]();
  })
  .then(() => {
    console.log('-'.repeat(60));
    console.log(`Test suite "${testSuite}" completed.`);
    console.log(`See report at: ${reportPath}`);
  })
  .catch(error => {
    console.error(`Error running test suite "${testSuite}":`, error);
    process.exit(1);
  }); 