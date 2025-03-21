/**
 * @file Run All Tests
 * @version 1.0.0
 * @status TEST
 * 
 * Script to run all MCP server tests in sequence
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

// List of test files to run
const testFiles = [
  'tools/list-tools-test.ts',
  'tools/erc20-test.ts',
  'tools/erc721-test.ts'
];

/**
 * Runs a TypeScript test file using ts-node
 */
async function runTest(testFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Running test: ${testFile}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const testProcess = spawn('npx', ['ts-node', '--project', 'tsconfig-node.json', testFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Test passed: ${testFile}\n`);
        resolve(true);
      } else {
        console.error(`\n❌ Test failed: ${testFile} (exit code: ${code})\n`);
        resolve(false);
      }
    });
  });
}

/**
 * Runs all tests in sequence
 */
async function runAllTests() {
  console.log('Starting MCP server test suite...\n');
  
  let allPassed = true;
  const startTime = Date.now();
  
  for (const testFile of testFiles) {
    const testPath = resolve(__dirname, testFile);
    const passed = await runTest(testPath);
    
    if (!passed) {
      allPassed = false;
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  
  console.log(`\n${'='.repeat(80)}`);
  if (allPassed) {
    console.log(`✅ All tests passed! (${duration.toFixed(2)}s)`);
  } else {
    console.log(`❌ Some tests failed. (${duration.toFixed(2)}s)`);
    process.exit(1);
  }
  console.log(`${'='.repeat(80)}\n`);
}

// Run all tests
runAllTests().catch(err => {
  console.error('Unhandled error running tests:', err);
  process.exit(1);
}); 