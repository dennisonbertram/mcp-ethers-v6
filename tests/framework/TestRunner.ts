/**
 * @file TestRunner.ts
 * @description Test execution engine for running MCP test cases systematically
 */

import { MCPTestClient } from './MCPTestClient.js';
import {
  TestCase,
  TestSuite,
  TestResult,
  TestSuiteResult,
  TestConfig,
  TestCategory,
  TestSeverity,
  ValidationRule,
  ValidationRuleType
} from './TestCase.js';
import { EventEmitter } from 'events';

/**
 * Test runner events
 */
export interface TestRunnerEvents {
  'suite:start': (suite: TestSuite) => void;
  'suite:end': (result: TestSuiteResult) => void;
  'test:start': (testCase: TestCase) => void;
  'test:pass': (result: TestResult) => void;
  'test:fail': (result: TestResult) => void;
  'test:skip': (result: TestResult) => void;
  'progress': (current: number, total: number) => void;
  'error': (error: Error) => void;
}

/**
 * Test runner for executing MCP test suites
 */
export class TestRunner extends EventEmitter {
  private client: MCPTestClient;
  private config: TestConfig;
  private results: TestResult[] = [];
  private executedTests: Set<string> = new Set();
  private failureCount: number = 0;

  constructor(client: MCPTestClient, config: TestConfig = {}) {
    super();
    this.client = client;
    this.config = {
      parallel: false,
      maxConcurrency: 5,
      stopOnFailure: false,
      retryFailedTests: false,
      maxRetries: 2,
      verbose: false,
      timeout: 30000,
      outputFormat: 'console',
      ...config
    };
  }

  /**
   * Runs a single test case
   */
  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    let result: TestResult = {
      testId: testCase.id,
      testName: testCase.name,
      passed: false,
      skipped: false,
      duration: 0,
      timestamp: new Date(),
      validationResults: []
    };

    try {
      // Check if test should be skipped
      if (testCase.skip) {
        result.skipped = true;
        result.duration = 0;
        this.emit('test:skip', result);
        return result;
      }

      // Check dependencies
      if (testCase.dependencies && testCase.dependencies.length > 0) {
        const unmetDeps = testCase.dependencies.filter((dep: any) => !this.executedTests.has(dep));
        if (unmetDeps.length > 0) {
          result.skipped = true;
          result.error = `Unmet dependencies: ${unmetDeps.join(', ')}`;
          this.emit('test:skip', result);
          return result;
        }
      }

      // Run setup if provided
      if (testCase.setup) {
        await testCase.setup();
      }

      // Execute the test based on category
      let response: any;
      
      switch (testCase.category) {
        case TestCategory.TOOLS:
          if (!testCase.toolName) {
            throw new Error('Tool test case must specify toolName');
          }
          const toolResult = await this.client.callTool(
            testCase.toolName,
            testCase.parameters
          );
          response = toolResult.response;
          result.actualResponse = response;
          
          // Check if tool call was successful
          if (!toolResult.success && testCase.expectedResponse?.success !== false) {
            throw new Error(toolResult.error);
          }
          break;

        case TestCategory.RESOURCES:
          if (!testCase.resourceUri) {
            throw new Error('Resource test case must specify resourceUri');
          }
          response = await this.client.readResource(testCase.resourceUri);
          result.actualResponse = response;
          break;

        case TestCategory.PROMPTS:
          if (!testCase.promptName) {
            throw new Error('Prompt test case must specify promptName');
          }
          response = await this.client.getPrompt(
            testCase.promptName,
            testCase.parameters
          );
          result.actualResponse = response;
          break;

        case TestCategory.PARAMETERS:
        case TestCategory.ERROR_HANDLING:
          // These are usually tool tests with specific parameter scenarios
          if (testCase.toolName) {
            const paramResult = await this.client.callTool(
              testCase.toolName,
              testCase.parameters
            );
            response = paramResult.response;
            result.actualResponse = response;
            
            if (!paramResult.success && testCase.expectedResponse?.success !== false) {
              result.error = paramResult.error;
            }
          }
          break;

        default:
          throw new Error(`Unsupported test category: ${testCase.category}`);
      }

      // Validate the response
      const validationResults = await this.validateResponse(
        response,
        testCase.validationRules,
        testCase.expectedResponse
      );

      result.validationResults = validationResults;
      result.passed = validationResults.every(v => v.passed);

      // Run teardown if provided
      if (testCase.teardown) {
        await testCase.teardown();
      }

      // Record execution time
      result.duration = Date.now() - startTime;

      // Check response time if specified
      if (testCase.expectedResponse?.maxResponseTime) {
        if (result.duration > testCase.expectedResponse.maxResponseTime) {
          result.passed = false;
          result.error = `Response time ${result.duration}ms exceeded maximum ${testCase.expectedResponse.maxResponseTime}ms`;
        }
      }

      // Mark test as executed
      this.executedTests.add(testCase.id);

      // Emit appropriate event
      if (result.passed) {
        this.emit('test:pass', result);
      } else {
        this.failureCount++;
        this.emit('test:fail', result);
      }

    } catch (error) {
      result.passed = false;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      this.failureCount++;
      this.emit('test:fail', result);
    }

    return result;
  }

  /**
   * Validates a response against validation rules
   */
  private async validateResponse(
    response: any,
    rules: ValidationRule[],
    expectedResponse?: any
  ): Promise<Array<{ rule: ValidationRule; passed: boolean; message?: string }>> {
    const results: Array<{ rule: ValidationRule; passed: boolean; message?: string }> = [];

    // Check expected response structure if provided
    if (expectedResponse?.structure) {
      const structureRule: ValidationRule = {
        type: ValidationRuleType.RESPONSE_STRUCTURE,
        expected: expectedResponse.structure
      };
      
      const matches = this.matchesStructure(response, expectedResponse.structure);
      results.push({
        rule: structureRule,
        passed: matches,
        message: matches ? undefined : 'Response structure does not match expected'
      });
    }

    // Check custom validator if provided
    if (expectedResponse?.customValidator) {
      const customRule: ValidationRule = {
        type: ValidationRuleType.CUSTOM,
        validator: expectedResponse.customValidator
      };
      
      const passed = expectedResponse.customValidator(response);
      results.push({
        rule: customRule,
        passed,
        message: passed ? undefined : 'Custom validation failed'
      });
    }

    // Apply validation rules
    for (const rule of rules) {
      let passed = false;
      let message: string | undefined;

      switch (rule.type) {
        case ValidationRuleType.REQUIRED:
          if (rule.field) {
            passed = this.hasField(response, rule.field);
            if (!passed) {
              message = rule.message || `Required field ${rule.field} is missing`;
            }
          }
          break;

        case ValidationRuleType.TYPE:
          if (rule.field) {
            const value = this.getFieldValue(response, rule.field);
            passed = typeof value === rule.expected;
            if (!passed) {
              message = rule.message || `Field ${rule.field} type mismatch. Expected ${rule.expected}, got ${typeof value}`;
            }
          }
          break;

        case ValidationRuleType.PATTERN:
          if (rule.field) {
            const value = this.getFieldValue(response, rule.field);
            if (rule.expected instanceof RegExp) {
              passed = rule.expected.test(String(value));
              if (!passed) {
                message = rule.message || `Field ${rule.field} does not match pattern ${rule.expected}`;
              }
            }
          }
          break;

        case ValidationRuleType.RANGE:
          if (rule.field) {
            const value = Number(this.getFieldValue(response, rule.field));
            const range = rule.expected as { min?: number; max?: number };
            passed = true;
            if (range.min !== undefined && value < range.min) {
              passed = false;
              message = `Field ${rule.field} value ${value} is below minimum ${range.min}`;
            }
            if (range.max !== undefined && value > range.max) {
              passed = false;
              message = `Field ${rule.field} value ${value} is above maximum ${range.max}`;
            }
          }
          break;

        case ValidationRuleType.CUSTOM:
          if (rule.validator) {
            passed = rule.validator(response);
            if (!passed) {
              message = rule.message || 'Custom validation failed';
            }
          }
          break;

        default:
          passed = true;
      }

      results.push({ rule, passed, message });
    }

    return results;
  }

  /**
   * Checks if response matches expected structure (partial match)
   */
  private matchesStructure(actual: any, expected: any): boolean {
    if (expected === null || expected === undefined) {
      return actual === expected;
    }

    if (typeof expected !== 'object') {
      return actual === expected;
    }

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) return false;
      return expected.every((exp, i) => this.matchesStructure(actual[i], exp));
    }

    // Object comparison (partial match - actual can have more fields)
    for (const key in expected) {
      if (!(key in actual)) return false;
      if (!this.matchesStructure(actual[key], expected[key])) return false;
    }

    return true;
  }

  /**
   * Checks if a field exists in the response (supports nested paths)
   */
  private hasField(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  /**
   * Gets field value from response (supports nested paths)
   */
  private getFieldValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Filters test cases based on configuration
   */
  private filterTestCases(testCases: TestCase[]): TestCase[] {
    let filtered = [...testCases];

    // Filter by pattern
    if (this.config.filter) {
      const pattern = this.config.filter instanceof RegExp
        ? this.config.filter
        : new RegExp(this.config.filter);
      
      filtered = filtered.filter(tc =>
        pattern.test(tc.name) || pattern.test(tc.id)
      );
    }

    // Filter by tags
    if (this.config.includeTags && this.config.includeTags.length > 0) {
      filtered = filtered.filter(tc =>
        tc.tags && tc.tags.some((tag: any) => this.config.includeTags!.includes(tag))
      );
    }

    if (this.config.excludeTags && this.config.excludeTags.length > 0) {
      filtered = filtered.filter(tc =>
        !tc.tags || !tc.tags.some((tag: any) => this.config.excludeTags!.includes(tag))
      );
    }

    // Filter by category
    if (this.config.categories && this.config.categories.length > 0) {
      filtered = filtered.filter(tc =>
        this.config.categories!.includes(tc.category)
      );
    }

    // Filter by severity
    if (this.config.severities && this.config.severities.length > 0) {
      filtered = filtered.filter(tc =>
        this.config.severities!.includes(tc.severity)
      );
    }

    return filtered;
  }

  /**
   * Runs test cases sequentially
   */
  private async runSequential(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const total = testCases.length;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      this.emit('test:start', testCase);
      this.emit('progress', i + 1, total);
      
      const result = await this.runTestCase(testCase);
      results.push(result);
      
      // Stop on failure if configured
      if (this.config.stopOnFailure && !result.passed && !result.skipped) {
        break;
      }
    }

    return results;
  }

  /**
   * Runs test cases in parallel
   */
  private async runParallel(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const maxConcurrency = this.config.maxConcurrency || 5;
    const total = testCases.length;
    let completed = 0;

    // Process in batches
    for (let i = 0; i < testCases.length; i += maxConcurrency) {
      const batch = testCases.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(testCase => {
        this.emit('test:start', testCase);
        return this.runTestCase(testCase);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      completed += batch.length;
      this.emit('progress', completed, total);
      
      // Check for stop on failure
      if (this.config.stopOnFailure && batchResults.some((r: any) => !r.passed && !r.skipped)) {
        break;
      }
    }

    return results;
  }

  /**
   * Runs a test suite
   */
  async runSuite(suite: TestSuite): Promise<TestSuiteResult> {
    const startTime = new Date();
    
    this.emit('suite:start', suite);
    
    // Reset state
    this.results = [];
    this.executedTests.clear();
    this.failureCount = 0;

    try {
      // Run suite setup
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Filter test cases
      const testCases = this.filterTestCases(suite.testCases);
      
      // Run test cases
      const results = this.config.parallel
        ? await this.runParallel(testCases)
        : await this.runSequential(testCases);

      // Run suite teardown
      if (suite.afterAll) {
        await suite.afterAll();
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const suiteResult: TestSuiteResult = {
        suiteId: suite.id,
        suiteName: suite.name,
        totalTests: testCases.length,
        passedTests: results.filter(r => r.passed).length,
        failedTests: results.filter(r => !r.passed && !r.skipped).length,
        skippedTests: results.filter(r => r.skipped).length,
        results,
        duration,
        startTime,
        endTime,
        passRate: testCases.length > 0
          ? (results.filter(r => r.passed).length / testCases.length) * 100
          : 0
      };

      this.emit('suite:end', suiteResult);
      return suiteResult;

    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Runs multiple test suites
   */
  async runSuites(suites: TestSuite[]): Promise<TestSuiteResult[]> {
    const results: TestSuiteResult[] = [];
    
    for (const suite of suites) {
      const result = await this.runSuite(suite);
      results.push(result);
      
      if (this.config.stopOnFailure && result.failedTests > 0) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): TestConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration
   */
  setConfig(config: Partial<TestConfig>): void {
    this.config = { ...this.config, ...config };
  }
}