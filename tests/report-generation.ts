/**
 * @file Test Report Generation
 * @version 1.0.0
 * @status TEST
 * 
 * Utility for generating test reports
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  error?: string;
  duration?: number;
}

class TestReport {
  private results: TestResult[] = [];
  private reportPath: string;
  
  constructor(reportPath: string = 'mcp-test-report.md') {
    this.reportPath = reportPath;
    // Initialize the report file
    this.initReportFile();
  }
  
  private initReportFile(): void {
    const header = `# MCP Test Report
Generated: ${new Date().toISOString()}

## Test Results

| Test | Status | Duration | Details |
|------|--------|----------|---------|
`;
    
    fs.writeFileSync(this.reportPath, header);
  }
  
  addResult(result: TestResult): void {
    this.results.push(result);
    
    // Append to the report file
    const row = `| ${result.testName} | ${result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${result.duration ? `${result.duration}ms` : 'N/A'} | ${result.details || ''} |\n`;
    fs.appendFileSync(this.reportPath, row);
    
    // If there's an error, add it as a details section
    if (result.error) {
      const errorSection = `
### Error Details for ${result.testName}
\`\`\`
${result.error}
\`\`\`
`;
      fs.appendFileSync(this.reportPath, errorSection);
    }
  }
  
  generateSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    
    const summarySection = `
## Summary
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${failedTests}
- Success Rate: ${Math.round((passedTests / totalTests) * 100)}%

Test completed at ${new Date().toISOString()}
`;
    
    fs.appendFileSync(this.reportPath, summarySection);
    
    console.log(`Test report generated at ${this.reportPath}`);
  }
}

// Singleton instance
let reportInstance: TestReport | null = null;

export function getTestReport(reportPath?: string): TestReport {
  if (!reportInstance) {
    reportInstance = new TestReport(reportPath);
  }
  return reportInstance;
}

export async function runTest(
  testName: string, 
  testFn: () => Promise<void>, 
  details?: string
): Promise<void> {
  const report = getTestReport();
  const startTime = Date.now();
  
  try {
    console.log(`Running test: ${testName}`);
    await testFn();
    const duration = Date.now() - startTime;
    
    report.addResult({
      testName,
      status: 'PASS',
      details,
      duration
    });
    
    console.log(`✅ Test passed: ${testName} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    
    report.addResult({
      testName,
      status: 'FAIL',
      details,
      error: errorMessage,
      duration
    });
    
    console.error(`❌ Test failed: ${testName} (${duration}ms)`);
    console.error(errorMessage);
  }
} 