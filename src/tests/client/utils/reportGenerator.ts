/**
 * @file Report Generator
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Generate test reports for MCP test client
 * 
 * IMPORTANT:
 * - Keep report formats consistent
 * - Use logger for output
 * 
 * Functionality:
 * - Generate text reports
 * - Calculate test statistics
 */

import { TestSuiteResult, formatTestResults } from './testRunner.js';
import { logger } from '../../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a console report for test results
 * 
 * @param results Test results to report
 */
export function generateConsoleReport(results: TestSuiteResult[]): void {
  let totalTests = 0;
  let totalPassed = 0;
  let totalDuration = 0;
  
  // Log individual suite results
  results.forEach(result => {
    totalTests += result.passed.length + result.failed.length;
    totalPassed += result.passed.length;
    totalDuration += result.duration;
    
    logger.info(formatTestResults(result));
  });
  
  // Log summary
  const passRate = Math.round((totalPassed / totalTests) * 100);
  
  logger.info('\n=== SUMMARY ===\n');
  logger.info(`Total suites: ${results.length}`);
  logger.info(`Total tests: ${totalTests}`);
  logger.info(`Total passed: ${totalPassed} (${passRate}%)`);
  logger.info(`Total failed: ${totalTests - totalPassed}`);
  logger.info(`Total duration: ${totalDuration}ms`);
}

/**
 * Generate a JSON report file
 * 
 * @param results Test results to report
 * @param filePath Path to write the report file
 */
export async function generateJsonReport(
  results: TestSuiteResult[],
  filePath = 'test-report.json'
): Promise<void> {
  try {
    const reportDir = path.dirname(filePath);
    await fs.mkdir(reportDir, { recursive: true });
    
    await fs.writeFile(
      filePath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalSuites: results.length,
          totalTests: results.reduce((sum, suite) => sum + suite.passed.length + suite.failed.length, 0),
          totalPassed: results.reduce((sum, suite) => sum + suite.passed.length, 0),
          totalFailed: results.reduce((sum, suite) => sum + suite.failed.length, 0),
          totalDuration: results.reduce((sum, suite) => sum + suite.duration, 0),
        }
      }, null, 2)
    );
    
    logger.info(`JSON report written to ${filePath}`);
  } catch (error) {
    logger.error('Failed to write JSON report', { error, filePath });
    throw error;
  }
}

/**
 * Generate an HTML report file
 * 
 * @param results Test results to report
 * @param filePath Path to write the report file
 */
export async function generateHtmlReport(
  results: TestSuiteResult[],
  filePath = 'test-report.html'
): Promise<void> {
  try {
    const reportDir = path.dirname(filePath);
    await fs.mkdir(reportDir, { recursive: true });
    
    const totalTests = results.reduce((sum, suite) => sum + suite.passed.length + suite.failed.length, 0);
    const totalPassed = results.reduce((sum, suite) => sum + suite.passed.length, 0);
    const passRate = Math.round((totalPassed / totalTests) * 100);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MCP Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .summary { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          .suite { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          .test { margin: 5px 0; padding: 10px; border-radius: 3px; }
          .passed { background: #e6ffe6; }
          .failed { background: #ffe6e6; }
          .error { font-family: monospace; white-space: pre-wrap; margin-top: 10px; }
          .timestamp { color: #666; font-size: 0.8em; }
        </style>
      </head>
      <body>
        <h1>MCP Test Report</h1>
        <div class="timestamp">Generated on ${new Date().toISOString()}</div>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Suites: ${results.length}</p>
          <p>Total Tests: ${totalTests}</p>
          <p>Passed: ${totalPassed} (${passRate}%)</p>
          <p>Failed: ${totalTests - totalPassed}</p>
          <p>Total Duration: ${results.reduce((sum, suite) => sum + suite.duration, 0)}ms</p>
        </div>
    `;
    
    results.forEach(suite => {
      const suitePassRate = Math.round((suite.passed.length / (suite.passed.length + suite.failed.length)) * 100);
      
      html += `
        <div class="suite">
          <h2>${suite.suiteName}</h2>
          <p>Tests: ${suite.passed.length + suite.failed.length}</p>
          <p>Passed: ${suite.passed.length} (${suitePassRate}%)</p>
          <p>Failed: ${suite.failed.length}</p>
          <p>Duration: ${suite.duration}ms</p>
          
          <h3>Failed Tests</h3>
          ${suite.failed.length === 0 ? '<p>None</p>' : ''}
      `;
      
      suite.failed.forEach(test => {
        html += `
          <div class="test failed">
            <strong>❌ ${test.name}</strong> (${test.duration}ms)
            ${test.error ? `<div class="error">${test.error.message}</div>` : ''}
          </div>
        `;
      });
      
      html += `
        <h3>Passed Tests</h3>
        ${suite.passed.length === 0 ? '<p>None</p>' : ''}
      `;
      
      suite.passed.forEach(test => {
        html += `
          <div class="test passed">
            <strong>✅ ${test.name}</strong> (${test.duration}ms)
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    html += `
      </body>
      </html>
    `;
    
    await fs.writeFile(filePath, html);
    logger.info(`HTML report written to ${filePath}`);
  } catch (error) {
    logger.error('Failed to write HTML report', { error, filePath });
    throw error;
  }
}

/**
 * Generate all report formats
 * 
 * @param results Test results to report
 * @param options Report options
 */
export async function generateReports(
  results: TestSuiteResult[],
  options: {
    consoleReport?: boolean;
    jsonReport?: boolean;
    jsonPath?: string;
    htmlReport?: boolean;
    htmlPath?: string;
  } = {}
): Promise<void> {
  const {
    consoleReport = true,
    jsonReport = true,
    jsonPath = 'reports/test-report.json',
    htmlReport = true,
    htmlPath = 'reports/test-report.html',
  } = options;
  
  if (consoleReport) {
    generateConsoleReport(results);
  }
  
  if (jsonReport) {
    await generateJsonReport(results, jsonPath);
  }
  
  if (htmlReport) {
    await generateHtmlReport(results, htmlPath);
  }
} 