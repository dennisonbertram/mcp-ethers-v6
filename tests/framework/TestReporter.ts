/**
 * @file TestReporter.ts
 * @description Test reporting system for MCP test results
 */

import { TestResult, TestSuiteResult, TestSeverity, TestCategory } from './TestCase.js';
import { TestRunner } from './TestRunner.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Report format options
 */
export type ReportFormat = 'console' | 'json' | 'html' | 'junit' | 'markdown';

/**
 * Report configuration
 */
export interface ReportConfig {
  /** Output format */
  format: ReportFormat;
  /** Output file path */
  outputPath?: string;
  /** Include detailed error messages */
  includeErrors?: boolean;
  /** Include response data */
  includeResponses?: boolean;
  /** Include timing information */
  includeTiming?: boolean;
  /** Include validation details */
  includeValidation?: boolean;
  /** Console output colors */
  useColors?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Summary statistics for test results
 */
export interface TestSummary {
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  totalDuration: number;
  averageDuration: number;
  testsByCategory: Record<TestCategory, number>;
  testsBySeverity: Record<TestSeverity, number>;
  failuresByCategory: Record<TestCategory, number>;
  slowestTests: Array<{ name: string; duration: number }>;
  failedTestsList: Array<{ name: string; error: string }>;
}

/**
 * Test reporter for generating test reports
 */
export class TestReporter {
  private config: ReportConfig;
  private testRunner?: TestRunner;

  constructor(config: Partial<ReportConfig> = {}) {
    this.config = {
      format: 'console',
      includeErrors: true,
      includeResponses: false,
      includeTiming: true,
      includeValidation: true,
      useColors: true,
      verbose: false,
      ...config
    };
  }

  /**
   * Attaches to a test runner to listen for events
   */
  attachToRunner(runner: TestRunner): void {
    this.testRunner = runner;

    runner.on('test:start', (testCase: any) => {
      if (this.config.verbose) {
        this.logTestStart(testCase.name);
      }
    });

    runner.on('test:pass', (result: any) => {
      this.logTestPass(result);
    });

    runner.on('test:fail', (result: any) => {
      this.logTestFail(result);
    });

    runner.on('test:skip', (result: any) => {
      this.logTestSkip(result);
    });

    runner.on('suite:start', (suite: any) => {
      this.logSuiteStart(suite.name);
    });

    runner.on('suite:end', (result: any) => {
      this.logSuiteEnd(result);
    });

    runner.on('progress', (current: any, total: any) => {
      if (this.config.verbose) {
        this.logProgress(current, total);
      }
    });
  }

  /**
   * Generates a report for test suite results
   */
  async generateReport(results: TestSuiteResult | TestSuiteResult[]): Promise<string> {
    const suiteResults = Array.isArray(results) ? results : [results];
    
    switch (this.config.format) {
      case 'console':
        return this.generateConsoleReport(suiteResults);
      case 'json':
        return this.generateJSONReport(suiteResults);
      case 'html':
        return this.generateHTMLReport(suiteResults);
      case 'junit':
        return this.generateJUnitReport(suiteResults);
      case 'markdown':
        return this.generateMarkdownReport(suiteResults);
      default:
        throw new Error(`Unsupported report format: ${this.config.format}`);
    }
  }

  /**
   * Saves report to file
   */
  async saveReport(report: string, outputPath?: string): Promise<void> {
    const filePath = outputPath || this.config.outputPath;
    
    if (!filePath) {
      throw new Error('No output path specified');
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, report, 'utf-8');
  }

  /**
   * Generates summary statistics
   */
  private generateSummary(results: TestSuiteResult[]): TestSummary {
    const summary: TestSummary = {
      totalSuites: results.length,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      passRate: 0,
      totalDuration: 0,
      averageDuration: 0,
      testsByCategory: {} as Record<TestCategory, number>,
      testsBySeverity: {} as Record<TestSeverity, number>,
      failuresByCategory: {} as Record<TestCategory, number>,
      slowestTests: [],
      failedTestsList: []
    };

    const allTests: TestResult[] = [];

    for (const suite of results) {
      summary.totalTests += suite.totalTests;
      summary.passedTests += suite.passedTests;
      summary.failedTests += suite.failedTests;
      summary.skippedTests += suite.skippedTests;
      summary.totalDuration += suite.duration;
      
      allTests.push(...suite.results);
    }

    // Calculate pass rate
    if (summary.totalTests > 0) {
      summary.passRate = (summary.passedTests / summary.totalTests) * 100;
      summary.averageDuration = summary.totalDuration / summary.totalTests;
    }

    // Find slowest tests
    const sortedByDuration = [...allTests]
      .filter(t => !t.skipped)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    summary.slowestTests = sortedByDuration.map(t => ({
      name: t.testName,
      duration: t.duration
    }));

    // Collect failed tests
    summary.failedTestsList = allTests
      .filter(t => !t.passed && !t.skipped)
      .map(t => ({
        name: t.testName,
        error: t.error || 'Unknown error'
      }));

    return summary;
  }

  /**
   * Generates console report
   */
  private generateConsoleReport(results: TestSuiteResult[]): string {
    const summary = this.generateSummary(results);
    const lines: string[] = [];

    // Header
    lines.push('\n' + '='.repeat(80));
    lines.push(this.formatTitle('MCP TEST REPORT'));
    lines.push('='.repeat(80));

    // Summary
    lines.push('\n📊 Summary');
    lines.push('-'.repeat(40));
    lines.push(`Total Suites: ${summary.totalSuites}`);
    lines.push(`Total Tests: ${summary.totalTests}`);
    lines.push(`✅ Passed: ${summary.passedTests}`);
    lines.push(`❌ Failed: ${summary.failedTests}`);
    lines.push(`⏭️  Skipped: ${summary.skippedTests}`);
    lines.push(`Pass Rate: ${summary.passRate.toFixed(2)}%`);
    lines.push(`Total Duration: ${this.formatDuration(summary.totalDuration)}`);
    lines.push(`Average Duration: ${this.formatDuration(summary.averageDuration)}`);

    // Suite details
    for (const suite of results) {
      lines.push('\n' + '─'.repeat(60));
      lines.push(`📦 Suite: ${suite.suiteName}`);
      lines.push(`   Tests: ${suite.totalTests} | Pass: ${suite.passedTests} | Fail: ${suite.failedTests} | Skip: ${suite.skippedTests}`);
      lines.push(`   Duration: ${this.formatDuration(suite.duration)}`);

      if (this.config.verbose) {
        for (const test of suite.results) {
          const icon = test.passed ? '✅' : test.skipped ? '⏭️' : '❌';
          lines.push(`   ${icon} ${test.testName} (${test.duration}ms)`);
          
          if (!test.passed && !test.skipped && this.config.includeErrors) {
            lines.push(`      Error: ${test.error}`);
          }
        }
      }
    }

    // Failed tests details
    if (summary.failedTestsList.length > 0 && this.config.includeErrors) {
      lines.push('\n' + '─'.repeat(60));
      lines.push('❌ Failed Tests');
      lines.push('─'.repeat(60));
      for (const failed of summary.failedTestsList) {
        lines.push(`• ${failed.name}`);
        lines.push(`  Error: ${failed.error}`);
      }
    }

    // Slowest tests
    if (summary.slowestTests.length > 0 && this.config.includeTiming) {
      lines.push('\n' + '─'.repeat(60));
      lines.push('⏱️  Slowest Tests');
      lines.push('─'.repeat(60));
      for (const slow of summary.slowestTests) {
        lines.push(`• ${slow.name}: ${this.formatDuration(slow.duration)}`);
      }
    }

    lines.push('\n' + '='.repeat(80));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generates JSON report
   */
  private generateJSONReport(results: TestSuiteResult[]): string {
    const summary = this.generateSummary(results);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      suites: results.map(suite => ({
        id: suite.suiteId,
        name: suite.suiteName,
        totalTests: suite.totalTests,
        passedTests: suite.passedTests,
        failedTests: suite.failedTests,
        skippedTests: suite.skippedTests,
        duration: suite.duration,
        startTime: suite.startTime,
        endTime: suite.endTime,
        passRate: suite.passRate,
        tests: this.config.includeResponses ? suite.results : suite.results.map((r: any) => ({
          testId: r.testId,
          testName: r.testName,
          passed: r.passed,
          skipped: r.skipped,
          error: r.error,
          duration: r.duration,
          timestamp: r.timestamp
        }))
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generates HTML report
   */
  private generateHTMLReport(results: TestSuiteResult[]): string {
    const summary = this.generateSummary(results);
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>MCP Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .suite { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>MCP Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${summary.totalTests}</p>
        <p class="passed">Passed: ${summary.passedTests}</p>
        <p class="failed">Failed: ${summary.failedTests}</p>
        <p class="skipped">Skipped: ${summary.skippedTests}</p>
        <p>Pass Rate: ${summary.passRate.toFixed(2)}%</p>
        <p>Duration: ${this.formatDuration(summary.totalDuration)}</p>
    </div>
    ${results.map(suite => `
        <div class="suite">
            <h3>${suite.suiteName}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration</th>
                        ${this.config.includeErrors ? '<th>Error</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${suite.results.map((test: any) => `
                        <tr>
                            <td>${test.testName}</td>
                            <td class="${test.passed ? 'passed' : test.skipped ? 'skipped' : 'failed'}">
                                ${test.passed ? 'PASSED' : test.skipped ? 'SKIPPED' : 'FAILED'}
                            </td>
                            <td>${test.duration}ms</td>
                            ${this.config.includeErrors ? `<td>${test.error || ''}</td>` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}
</body>
</html>`;
    
    return html;
  }

  /**
   * Generates JUnit XML report
   */
  private generateJUnitReport(results: TestSuiteResult[]): string {
    const xml: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    xml.push('<testsuites>');

    for (const suite of results) {
      xml.push(`  <testsuite name="${suite.suiteName}" tests="${suite.totalTests}" failures="${suite.failedTests}" skipped="${suite.skippedTests}" time="${(suite.duration / 1000).toFixed(3)}">`);
      
      for (const test of suite.results) {
        xml.push(`    <testcase name="${test.testName}" classname="${suite.suiteName}" time="${(test.duration / 1000).toFixed(3)}">`);
        
        if (!test.passed && !test.skipped) {
          xml.push(`      <failure message="${this.escapeXml(test.error || 'Test failed')}">${this.escapeXml(test.error || '')}</failure>`);
        }
        
        if (test.skipped) {
          xml.push(`      <skipped message="Test skipped" />`);
        }
        
        xml.push('    </testcase>');
      }
      
      xml.push('  </testsuite>');
    }

    xml.push('</testsuites>');
    return xml.join('\n');
  }

  /**
   * Generates Markdown report
   */
  private generateMarkdownReport(results: TestSuiteResult[]): string {
    const summary = this.generateSummary(results);
    const lines: string[] = [];

    // Header
    lines.push('# MCP Test Report');
    lines.push(`*Generated: ${new Date().toISOString()}*`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|--------|');
    lines.push(`| Total Tests | ${summary.totalTests} |`);
    lines.push(`| Passed | ${summary.passedTests} |`);
    lines.push(`| Failed | ${summary.failedTests} |`);
    lines.push(`| Skipped | ${summary.skippedTests} |`);
    lines.push(`| Pass Rate | ${summary.passRate.toFixed(2)}% |`);
    lines.push(`| Total Duration | ${this.formatDuration(summary.totalDuration)} |`);
    lines.push('');

    // Suite results
    lines.push('## Test Suites');
    lines.push('');

    for (const suite of results) {
      lines.push(`### ${suite.suiteName}`);
      lines.push('');
      lines.push('| Test Name | Status | Duration |');
      lines.push('|-----------|--------|----------|');
      
      for (const test of suite.results) {
        const status = test.passed ? '✅ PASS' : test.skipped ? '⏭️ SKIP' : '❌ FAIL';
        lines.push(`| ${test.testName} | ${status} | ${test.duration}ms |`);
      }
      lines.push('');
    }

    // Failed tests
    if (summary.failedTestsList.length > 0) {
      lines.push('## Failed Tests');
      lines.push('');
      for (const failed of summary.failedTestsList) {
        lines.push(`- **${failed.name}**`);
        lines.push(`  - Error: ${failed.error}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // Logging methods for console output
  private logTestStart(name: string): void {
    if (this.config.format === 'console') {
      console.log(`  ⏱️  Starting: ${name}`);
    }
  }

  private logTestPass(result: TestResult): void {
    if (this.config.format === 'console') {
      const duration = this.config.includeTiming ? ` (${result.duration}ms)` : '';
      console.log(`  ✅ PASS: ${result.testName}${duration}`);
    }
  }

  private logTestFail(result: TestResult): void {
    if (this.config.format === 'console') {
      const duration = this.config.includeTiming ? ` (${result.duration}ms)` : '';
      console.log(`  ❌ FAIL: ${result.testName}${duration}`);
      if (this.config.includeErrors && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
  }

  private logTestSkip(result: TestResult): void {
    if (this.config.format === 'console') {
      console.log(`  ⏭️  SKIP: ${result.testName}`);
    }
  }

  private logSuiteStart(name: string): void {
    if (this.config.format === 'console') {
      console.log(`\n📦 Running Suite: ${name}`);
    }
  }

  private logSuiteEnd(result: TestSuiteResult): void {
    if (this.config.format === 'console') {
      console.log(`\n  Suite Complete: ${result.passedTests}/${result.totalTests} passed (${result.passRate.toFixed(1)}%)`);
    }
  }

  private logProgress(current: number, total: number): void {
    if (this.config.format === 'console') {
      const percent = ((current / total) * 100).toFixed(0);
      process.stdout.write(`\r  Progress: ${current}/${total} (${percent}%)`);
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }

  // Utility methods
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  private formatTitle(title: string): string {
    const padding = Math.floor((80 - title.length) / 2);
    return ' '.repeat(padding) + title;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}