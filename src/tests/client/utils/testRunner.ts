/**
 * @file Test Runner
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Test runner utilities for MCP test client
 * 
 * IMPORTANT:
 * - Keep test runner simple and focused
 * - Report detailed results
 * 
 * Functionality:
 * - Run collections of tests
 * - Track test results
 * - Format test output
 */

import { logger } from "../../../utils/logger.js";

export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

export interface TestSuiteResult {
  suiteName: string;
  passed: TestResult[];
  failed: TestResult[];
  duration: number;
}

/**
 * Run a collection of tests and return the results
 * 
 * @param suiteName Name of the test suite
 * @param tests Array of test cases to run
 * @returns Results of the test run
 */
export async function runTests(
  suiteName: string, 
  tests: Array<{ name: string; test: () => Promise<void> }>
): Promise<TestSuiteResult> {
  const startTime = Date.now();
  const results: TestSuiteResult = {
    suiteName,
    passed: [],
    failed: [],
    duration: 0
  };

  logger.info(`Starting test suite: ${suiteName}`, { testCount: tests.length });

  for (const { name, test } of tests) {
    const testStartTime = Date.now();
    logger.info(`Running test: ${name}`);
    
    try {
      await test();
      const duration = Date.now() - testStartTime;
      
      results.passed.push({
        name,
        passed: true,
        duration
      });
      
      logger.info(`✅ Test passed: ${name}`, { duration: `${duration}ms` });
    } catch (error) {
      const duration = Date.now() - testStartTime;
      
      results.failed.push({
        name,
        passed: false,
        error: error as Error,
        duration
      });
      
      logger.error(`❌ Test failed: ${name}`, { 
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  results.duration = Date.now() - startTime;
  
  logger.info(`Test suite complete: ${suiteName}`, {
    total: tests.length,
    passed: results.passed.length,
    failed: results.failed.length,
    duration: `${results.duration}ms`
  });

  return results;
}

/**
 * Format test results as a string for display
 * 
 * @param results Results of a test run
 * @returns Formatted string representation of the results
 */
export function formatTestResults(results: TestSuiteResult): string {
  const totalTests = results.passed.length + results.failed.length;
  const passRate = Math.round((results.passed.length / totalTests) * 100);
  
  let output = `\n=== TEST RESULTS: ${results.suiteName} ===\n\n`;
  output += `Total tests: ${totalTests}\n`;
  output += `Passed: ${results.passed.length} (${passRate}%)\n`;
  output += `Failed: ${results.failed.length}\n`;
  output += `Duration: ${results.duration}ms\n`;
  
  if (results.failed.length > 0) {
    output += '\nFailed tests:\n';
    results.failed.forEach(({ name, error }) => {
      output += `  ❌ ${name}: ${error?.message || 'Unknown error'}\n`;
    });
  }
  
  if (results.passed.length > 0) {
    output += '\nPassed tests:\n';
    results.passed.forEach(({ name, duration }) => {
      output += `  ✅ ${name} (${duration}ms)\n`;
    });
  }
  
  return output;
}

/**
 * Run multiple test suites and combine the results
 * 
 * @param suites Map of test suites to run
 * @returns Combined results of all test suites
 */
export async function runTestSuites(
  suites: Map<string, Array<{ name: string; test: () => Promise<void> }>>
): Promise<TestSuiteResult[]> {
  const results: TestSuiteResult[] = [];
  
  for (const [suiteName, tests] of suites.entries()) {
    const suiteResult = await runTests(suiteName, tests);
    results.push(suiteResult);
  }
  
  return results;
} 