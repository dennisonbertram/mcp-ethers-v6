/**
 * @file Report Generator
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Generates comprehensive test reports for MCP client tests
 * 
 * IMPORTANT:
 * - Creates both HTML and JSON reports
 * - Provides detailed test results
 * 
 * Functionality:
 * - Generate JSON test reports
 * - Generate HTML test reports
 * - Save reports to disk
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestSuiteResult } from '../../client/utils/testRunner.js';
import { logger } from '../../../utils/logger.js';

/**
 * Generate and save test reports
 * 
 * @param results Test suite results
 * @param reportName Base name for the report files
 */
export function generateTestReport(results: TestSuiteResult[], reportName: string): void {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportBaseName = `${reportName}-${timestamp}`;
    
    // Generate and save JSON report
    const jsonReport = generateJsonReport(results);
    const jsonPath = path.join(reportsDir, `${reportBaseName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    
    // Generate and save HTML report
    const htmlReport = generateHtmlReport(results, jsonReport);
    const htmlPath = path.join(reportsDir, `${reportBaseName}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    logger.info('Test reports generated successfully', {
      jsonPath,
      htmlPath
    });
  } catch (error) {
    logger.error('Failed to generate test reports', { error });
  }
}

/**
 * Generate a JSON report from test results
 * 
 * @param results Test suite results
 * @returns JSON report object
 */
function generateJsonReport(results: TestSuiteResult[]): any {
  // Calculate overall statistics
  const totalTests = results.reduce((sum, suite) => sum + suite.passed.length + suite.failed.length, 0);
  const totalPassed = results.reduce((sum, suite) => sum + suite.passed.length, 0);
  const totalFailed = results.reduce((sum, suite) => sum + suite.failed.length, 0);
  const successRate = Math.round((totalPassed / totalTests) * 100);
  const totalDuration = results.reduce((sum, suite) => sum + suite.duration, 0);
  
  // Create the report object
  return {
    summary: {
      timestamp: new Date().toISOString(),
      totalSuites: results.length,
      totalTests,
      totalPassed,
      totalFailed,
      successRate,
      totalDuration
    },
    suites: results.map(suite => ({
      name: suite.suiteName,
      totalTests: suite.passed.length + suite.failed.length,
      passed: suite.passed.length,
      failed: suite.failed.length,
      duration: suite.duration,
      successRate: Math.round((suite.passed.length / (suite.passed.length + suite.failed.length)) * 100),
      tests: [
        ...suite.passed.map(test => ({
          name: test.name,
          status: 'passed',
          duration: test.duration
        })),
        ...suite.failed.map(test => ({
          name: test.name,
          status: 'failed',
          duration: test.duration,
          error: test.error ? test.error.message : 'Unknown error'
        }))
      ]
    }))
  };
}

// Define an interface for the suite shape in the HTML report
interface ReportSuite {
  name: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  successRate: number;
  tests: Array<{
    name: string;
    status: string;
    duration: number;
    error?: string;
  }>;
}

/**
 * Generate an HTML report from test results
 * 
 * @param results Test suite results
 * @param jsonReport The JSON report data
 * @returns HTML report as a string
 */
function generateHtmlReport(results: TestSuiteResult[], jsonReport: any): string {
  const { summary, suites } = jsonReport;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Client Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .summary {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-gap: 15px;
    }
    .summary-item {
      background: white;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-label {
      font-weight: bold;
      font-size: 0.9em;
      color: #666;
    }
    .summary-value {
      font-size: 1.5em;
      font-weight: bold;
    }
    .success-rate {
      font-size: 2em;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .success-rate.high {
      color: #4CAF50;
    }
    .success-rate.medium {
      color: #FFC107;
    }
    .success-rate.low {
      color: #F44336;
    }
    .test-suite {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .suite-header {
      background-color: #f5f5f5;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .suite-title {
      margin: 0;
      font-size: 1.2em;
    }
    .suite-stats {
      display: flex;
      gap: 15px;
      font-size: 0.9em;
    }
    .test-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .test-item {
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
    }
    .test-item:last-child {
      border-bottom: none;
    }
    .test-name {
      font-weight: bold;
    }
    .test-status {
      margin-left: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    .status-passed {
      background-color: #DFF2BF;
      color: #4F8A10;
    }
    .status-failed {
      background-color: #FFBABA;
      color: #D8000C;
    }
    .test-duration {
      float: right;
      color: #666;
      font-size: 0.9em;
    }
    .test-error {
      margin-top: 5px;
      padding: 8px;
      background-color: #FFECEC;
      border-left: 4px solid #D8000C;
      font-family: monospace;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .timestamp {
      text-align: right;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>MCP Client Test Report</h1>
  <p class="timestamp">Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <div class="success-rate ${summary.successRate > 80 ? 'high' : summary.successRate > 50 ? 'medium' : 'low'}">
      ${summary.successRate}% Success Rate
    </div>
    
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Suites</div>
        <div class="summary-value">${summary.totalSuites}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Tests</div>
        <div class="summary-value">${summary.totalTests}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Passed Tests</div>
        <div class="summary-value">${summary.totalPassed}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Failed Tests</div>
        <div class="summary-value">${summary.totalFailed}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Duration</div>
        <div class="summary-value">${(summary.totalDuration / 1000).toFixed(2)}s</div>
      </div>
    </div>
  </div>
  
  <h2>Test Suites</h2>
  
  ${(suites as ReportSuite[]).map((suite: ReportSuite) => `
    <div class="test-suite">
      <div class="suite-header">
        <h3 class="suite-title">${suite.name}</h3>
        <div class="suite-stats">
          <span>${suite.successRate}% Success</span>
          <span>${suite.passed}/${suite.totalTests} Passed</span>
          <span>${(suite.duration / 1000).toFixed(2)}s</span>
        </div>
      </div>
      
      <ul class="test-list">
        ${suite.tests.map((test) => `
          <li class="test-item">
            <span class="test-name">${test.name}</span>
            <span class="test-status status-${test.status}">${test.status}</span>
            <span class="test-duration">${test.duration}ms</span>
            ${test.status === 'failed' ? `<pre class="test-error">${test.error}</pre>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('')}
</body>
</html>
  `;
} 