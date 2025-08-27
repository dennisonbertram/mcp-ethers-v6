/**
 * @file TestCase.ts
 * @description Test case definitions and types for MCP testing framework
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Severity levels for test cases
 */
export enum TestSeverity {
  CRITICAL = 'critical',  // Must pass for system to work
  HIGH = 'high',          // Important functionality
  MEDIUM = 'medium',      // Standard functionality
  LOW = 'low'             // Nice to have features
}

/**
 * Test categories for organizing tests
 */
export enum TestCategory {
  TOOLS = 'tools',
  RESOURCES = 'resources',
  PROMPTS = 'prompts',
  PARAMETERS = 'parameters',
  ERROR_HANDLING = 'error-handling',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPATIBILITY = 'compatibility'
}

/**
 * Validation rule types
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  TYPE = 'type',
  FORMAT = 'format',
  RANGE = 'range',
  PATTERN = 'pattern',
  CUSTOM = 'custom',
  RESPONSE_STRUCTURE = 'response-structure',
  ERROR_CODE = 'error-code'
}

/**
 * A validation rule for test cases
 */
export interface ValidationRule {
  type: ValidationRuleType;
  field?: string;
  expected?: any;
  validator?: (value: any) => boolean;
  message?: string;
}

/**
 * Expected response structure for tests
 */
export interface ExpectedResponse {
  /** Expected success status */
  success?: boolean;
  /** Expected response structure (partial match) */
  structure?: Record<string, any>;
  /** Expected error message pattern */
  errorPattern?: string | RegExp;
  /** Expected error code */
  errorCode?: number;
  /** Custom validation function */
  customValidator?: (response: any) => boolean;
  /** Expected response time in milliseconds */
  maxResponseTime?: number;
}

/**
 * Test context for parameterized tests
 */
export interface TestContext {
  /** Test environment (e.g., 'mainnet', 'testnet') */
  environment?: string;
  /** Network to test on */
  network?: string;
  /** User role or permissions */
  role?: string;
  /** Additional context data */
  data?: Record<string, any>;
}

/**
 * A single test case definition
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description of what is being tested */
  description: string;
  /** Test category */
  category: TestCategory;
  /** Test severity */
  severity: TestSeverity;
  /** Tool name for tool tests */
  toolName?: string;
  /** Resource URI for resource tests */
  resourceUri?: string;
  /** Prompt name for prompt tests */
  promptName?: string;
  /** Input parameters */
  parameters: Record<string, any>;
  /** Expected response */
  expectedResponse?: ExpectedResponse;
  /** Validation rules to apply */
  validationRules: ValidationRule[];
  /** Test context */
  context?: TestContext;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to skip this test */
  skip?: boolean;
  /** Reason for skipping */
  skipReason?: string;
  /** Dependencies on other test cases */
  dependencies?: string[];
  /** Tags for filtering */
  tags?: string[];
  /** Setup function to run before test */
  setup?: () => Promise<void>;
  /** Teardown function to run after test */
  teardown?: () => Promise<void>;
}

/**
 * Test suite definition
 */
export interface TestSuite {
  /** Suite identifier */
  id: string;
  /** Suite name */
  name: string;
  /** Suite description */
  description: string;
  /** Test cases in the suite */
  testCases: TestCase[];
  /** Setup for entire suite */
  beforeAll?: () => Promise<void>;
  /** Teardown for entire suite */
  afterAll?: () => Promise<void>;
  /** Setup before each test */
  beforeEach?: () => Promise<void>;
  /** Teardown after each test */
  afterEach?: () => Promise<void>;
  /** Suite-level timeout */
  timeout?: number;
  /** Tags for the suite */
  tags?: string[];
}

/**
 * Test execution result
 */
export interface TestResult {
  /** Test case ID */
  testId: string;
  /** Test case name */
  testName: string;
  /** Whether the test passed */
  passed: boolean;
  /** Whether the test was skipped */
  skipped: boolean;
  /** Error message if failed */
  error?: string;
  /** Actual response received */
  actualResponse?: any;
  /** Expected response */
  expectedResponse?: ExpectedResponse;
  /** Validation results */
  validationResults?: Array<{
    rule: ValidationRule;
    passed: boolean;
    message?: string;
  }>;
  /** Execution time in milliseconds */
  duration: number;
  /** Timestamp of execution */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Test suite execution result
 */
export interface TestSuiteResult {
  /** Suite ID */
  suiteId: string;
  /** Suite name */
  suiteName: string;
  /** Total tests */
  totalTests: number;
  /** Passed tests */
  passedTests: number;
  /** Failed tests */
  failedTests: number;
  /** Skipped tests */
  skippedTests: number;
  /** Individual test results */
  results: TestResult[];
  /** Suite execution duration */
  duration: number;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Pass rate percentage */
  passRate: number;
}

/**
 * Test configuration
 */
export interface TestConfig {
  /** Run tests in parallel */
  parallel?: boolean;
  /** Maximum parallel tests */
  maxConcurrency?: number;
  /** Stop on first failure */
  stopOnFailure?: boolean;
  /** Retry failed tests */
  retryFailedTests?: boolean;
  /** Number of retries */
  maxRetries?: number;
  /** Verbose output */
  verbose?: boolean;
  /** Test filter pattern */
  filter?: string | RegExp;
  /** Tags to include */
  includeTags?: string[];
  /** Tags to exclude */
  excludeTags?: string[];
  /** Categories to test */
  categories?: TestCategory[];
  /** Severities to test */
  severities?: TestSeverity[];
  /** Global timeout */
  timeout?: number;
  /** Output format */
  outputFormat?: 'json' | 'junit' | 'html' | 'console';
  /** Output file path */
  outputPath?: string;
}

/**
 * Test case builder for fluent API
 */
export class TestCaseBuilder {
  private testCase: Partial<TestCase> = {
    validationRules: [],
    parameters: {},
    tags: []
  };

  constructor(id: string, name: string) {
    this.testCase.id = id;
    this.testCase.name = name;
  }

  description(desc: string): TestCaseBuilder {
    this.testCase.description = desc;
    return this;
  }

  category(cat: TestCategory): TestCaseBuilder {
    this.testCase.category = cat;
    return this;
  }

  severity(sev: TestSeverity): TestCaseBuilder {
    this.testCase.severity = sev;
    return this;
  }

  tool(name: string): TestCaseBuilder {
    this.testCase.toolName = name;
    this.testCase.category = TestCategory.TOOLS;
    return this;
  }

  resource(uri: string): TestCaseBuilder {
    this.testCase.resourceUri = uri;
    this.testCase.category = TestCategory.RESOURCES;
    return this;
  }

  prompt(name: string): TestCaseBuilder {
    this.testCase.promptName = name;
    this.testCase.category = TestCategory.PROMPTS;
    return this;
  }

  parameters(params: Record<string, any>): TestCaseBuilder {
    this.testCase.parameters = params;
    return this;
  }

  expectSuccess(): TestCaseBuilder {
    if (!this.testCase.expectedResponse) {
      this.testCase.expectedResponse = {};
    }
    this.testCase.expectedResponse.success = true;
    return this;
  }

  expectError(pattern?: string | RegExp, code?: number): TestCaseBuilder {
    if (!this.testCase.expectedResponse) {
      this.testCase.expectedResponse = {};
    }
    this.testCase.expectedResponse.success = false;
    if (pattern) {
      this.testCase.expectedResponse.errorPattern = pattern;
    }
    if (code !== undefined) {
      this.testCase.expectedResponse.errorCode = code;
    }
    return this;
  }

  expectStructure(structure: Record<string, any>): TestCaseBuilder {
    if (!this.testCase.expectedResponse) {
      this.testCase.expectedResponse = {};
    }
    this.testCase.expectedResponse.structure = structure;
    return this;
  }

  addValidationRule(rule: ValidationRule): TestCaseBuilder {
    this.testCase.validationRules!.push(rule);
    return this;
  }

  requireField(field: string): TestCaseBuilder {
    return this.addValidationRule({
      type: ValidationRuleType.REQUIRED,
      field,
      message: `Field ${field} is required`
    });
  }

  validateType(field: string, type: string): TestCaseBuilder {
    return this.addValidationRule({
      type: ValidationRuleType.TYPE,
      field,
      expected: type,
      message: `Field ${field} should be of type ${type}`
    });
  }

  validatePattern(field: string, pattern: RegExp): TestCaseBuilder {
    return this.addValidationRule({
      type: ValidationRuleType.PATTERN,
      field,
      expected: pattern,
      message: `Field ${field} should match pattern ${pattern}`
    });
  }

  customValidator(validator: (response: any) => boolean, message?: string): TestCaseBuilder {
    return this.addValidationRule({
      type: ValidationRuleType.CUSTOM,
      validator,
      message: message || 'Custom validation failed'
    });
  }

  timeout(ms: number): TestCaseBuilder {
    this.testCase.timeout = ms;
    return this;
  }

  tags(...tags: string[]): TestCaseBuilder {
    this.testCase.tags!.push(...tags);
    return this;
  }

  dependsOn(...testIds: string[]): TestCaseBuilder {
    this.testCase.dependencies = testIds;
    return this;
  }

  skip(reason?: string): TestCaseBuilder {
    this.testCase.skip = true;
    this.testCase.skipReason = reason;
    return this;
  }

  setup(fn: () => Promise<void>): TestCaseBuilder {
    this.testCase.setup = fn;
    return this;
  }

  teardown(fn: () => Promise<void>): TestCaseBuilder {
    this.testCase.teardown = fn;
    return this;
  }

  build(): TestCase {
    // Validate required fields
    if (!this.testCase.id || !this.testCase.name) {
      throw new Error('Test case must have id and name');
    }
    if (!this.testCase.category) {
      throw new Error('Test case must have a category');
    }
    if (!this.testCase.severity) {
      this.testCase.severity = TestSeverity.MEDIUM;
    }
    if (!this.testCase.description) {
      this.testCase.description = this.testCase.name;
    }

    return this.testCase as TestCase;
  }
}

/**
 * Creates a new test case builder
 */
export function createTestCase(id: string, name: string): TestCaseBuilder {
  return new TestCaseBuilder(id, name);
}