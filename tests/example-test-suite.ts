/**
 * @file example-test-suite.ts
 * @description Example test suite demonstrating the MCP test framework usage
 * 
 * This example shows how to:
 * - Create test cases using the builder pattern
 * - Set up test suites
 * - Configure and run tests
 * - Generate reports
 */

import { MCPTestClient, createTestClient } from './framework/MCPTestClient.js';
import { 
  TestCase, 
  TestSuite, 
  TestCategory, 
  TestSeverity,
  createTestCase,
  ValidationRuleType
} from './framework/TestCase.js';
import { TestRunner } from './framework/TestRunner.js';
import { TestReporter } from './framework/TestReporter.js';
import { ResponseValidator } from './validation/ResponseValidator.js';

/**
 * Creates a comprehensive test suite for the MCP server
 */
async function createComprehensiveTestSuite(): Promise<TestSuite> {
  const testCases: TestCase[] = [];

  // ========================================
  // Tool Tests
  // ========================================

  // Test 1: Get Block Number - Success Case
  testCases.push(
    createTestCase('tool-001', 'Get Block Number - Valid Network')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.HIGH)
      .tool('getBlockNumber')
      .parameters({ provider: 'ethereum' })
      .expectSuccess()
      .requireField('content')
      .validateType('content', 'object')
      .customValidator((response: any) => {
        // Check that block number is a positive integer
        if (response?.content?.[0]?.text) {
          const blockNum = parseInt(response.content[0].text);
          return !isNaN(blockNum) && blockNum > 0;
        }
        return false;
      }, 'Block number should be a positive integer')
      .timeout(5000)
      .tags('core', 'network')
      .build()
  );

  // Test 2: Get Block Number - Invalid Network
  testCases.push(
    createTestCase('tool-002', 'Get Block Number - Invalid Network')
      .category(TestCategory.ERROR_HANDLING)
      .severity(TestSeverity.MEDIUM)
      .tool('getBlockNumber')
      .parameters({ provider: 'invalid_network' })
      .expectError(/invalid|unsupported|network/i)
      .timeout(5000)
      .tags('error', 'network')
      .build()
  );

  // Test 3: Get Balance - Valid Address
  testCases.push(
    createTestCase('tool-003', 'Get Balance - Valid Address')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.HIGH)
      .tool('getBalance')
      .parameters({
        address: '0x0000000000000000000000000000000000000000',
        provider: 'ethereum'
      })
      .expectSuccess()
      .requireField('content')
      .validateType('content', 'object')
      .timeout(5000)
      .tags('core', 'wallet')
      .build()
  );

  // Test 4: Get Balance - Invalid Address
  testCases.push(
    createTestCase('tool-004', 'Get Balance - Invalid Address')
      .category(TestCategory.PARAMETERS)
      .severity(TestSeverity.HIGH)
      .tool('getBalance')
      .parameters({
        address: 'not_a_valid_address',
        provider: 'ethereum'
      })
      .expectError(/invalid.*address/i)
      .timeout(5000)
      .tags('error', 'validation', 'wallet')
      .build()
  );

  // Test 5: Get Balance - Missing Parameters
  testCases.push(
    createTestCase('tool-005', 'Get Balance - Missing Address')
      .category(TestCategory.PARAMETERS)
      .severity(TestSeverity.HIGH)
      .tool('getBalance')
      .parameters({ provider: 'ethereum' })
      .expectError(/required|missing.*address/i)
      .timeout(5000)
      .tags('error', 'validation')
      .build()
  );

  // Test 6: ERC20 Get Balance
  testCases.push(
    createTestCase('tool-006', 'ERC20 Get Balance')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.MEDIUM)
      .tool('erc20_getBalance')
      .parameters({
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        account: '0x0000000000000000000000000000000000000000',
        provider: 'ethereum'
      })
      .expectSuccess()
      .requireField('content')
      .timeout(10000)
      .tags('erc20', 'token')
      .build()
  );

  // Test 7: ERC20 Get Total Supply
  testCases.push(
    createTestCase('tool-007', 'ERC20 Get Total Supply')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.LOW)
      .tool('erc20_getTotalSupply')
      .parameters({
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        provider: 'ethereum'
      })
      .expectSuccess()
      .requireField('content')
      .timeout(10000)
      .tags('erc20', 'token')
      .build()
  );

  // Test 8: ERC721 Get Balance
  testCases.push(
    createTestCase('tool-008', 'ERC721 Get Balance')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.LOW)
      .tool('erc721_getBalance')
      .parameters({
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
        owner: '0x0000000000000000000000000000000000000000',
        provider: 'ethereum'
      })
      .expectSuccess()
      .requireField('content')
      .timeout(10000)
      .tags('erc721', 'nft')
      .build()
  );

  // ========================================
  // Parameter Validation Tests
  // ========================================

  // Test 9: Parameter Type Validation
  testCases.push(
    createTestCase('param-001', 'Invalid Parameter Type')
      .category(TestCategory.PARAMETERS)
      .severity(TestSeverity.HIGH)
      .tool('getBlockNumber')
      .parameters({ provider: 123 }) // Should be string
      .expectError(/invalid.*type|must be.*string/i)
      .timeout(3000)
      .tags('validation', 'parameters')
      .build()
  );

  // Test 10: Extra Parameters
  testCases.push(
    createTestCase('param-002', 'Extra Parameters Ignored')
      .category(TestCategory.PARAMETERS)
      .severity(TestSeverity.LOW)
      .tool('getBlockNumber')
      .parameters({ 
        provider: 'ethereum',
        extraParam: 'should_be_ignored',
        anotherExtra: 123
      })
      .expectSuccess()
      .timeout(5000)
      .tags('validation', 'parameters')
      .build()
  );

  // ========================================
  // Performance Tests
  // ========================================

  // Test 11: Response Time Check
  testCases.push(
    createTestCase('perf-001', 'Get Block Number Performance')
      .category(TestCategory.PERFORMANCE)
      .severity(TestSeverity.LOW)
      .tool('getBlockNumber')
      .parameters({ provider: 'ethereum' })
      .expectSuccess()
      .expectStructure({
        content: [{
          type: 'text',
          text: expect.any(String)
        }]
      })
      .timeout(3000) // Strict timeout for performance
      .tags('performance')
      .build()
  );

  // ========================================
  // Security Tests
  // ========================================

  // Test 12: Injection Attack Prevention
  testCases.push(
    createTestCase('sec-001', 'SQL Injection Prevention')
      .category(TestCategory.SECURITY)
      .severity(TestSeverity.CRITICAL)
      .tool('getBalance')
      .parameters({
        address: "'; DROP TABLE users; --",
        provider: 'ethereum'
      })
      .expectError(/invalid.*address/i)
      .timeout(5000)
      .tags('security', 'injection')
      .build()
  );

  // Test 13: XSS Prevention
  testCases.push(
    createTestCase('sec-002', 'XSS Prevention in Parameters')
      .category(TestCategory.SECURITY)
      .severity(TestSeverity.HIGH)
      .tool('getBalance')
      .parameters({
        address: '<script>alert("xss")</script>',
        provider: 'ethereum'
      })
      .expectError(/invalid/i)
      .timeout(5000)
      .tags('security', 'xss')
      .build()
  );

  return {
    id: 'comprehensive-test-suite',
    name: 'Comprehensive MCP Server Test Suite',
    description: 'Tests all aspects of the MCP server implementation',
    testCases,
    beforeAll: async () => {
      console.log('Setting up test suite...');
      // Any suite-level setup
    },
    afterAll: async () => {
      console.log('Cleaning up test suite...');
      // Any suite-level cleanup
    },
    timeout: 60000,
    tags: ['comprehensive', 'all']
  };
}

/**
 * Creates a focused test suite for ERC20 tools
 */
async function createERC20TestSuite(): Promise<TestSuite> {
  const testCases: TestCase[] = [];
  
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const TEST_ACCOUNT = '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503'; // Binance wallet

  testCases.push(
    createTestCase('erc20-001', 'Get Token Name')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.HIGH)
      .tool('erc20_getName')
      .parameters({
        contractAddress: USDC_ADDRESS,
        provider: 'ethereum'
      })
      .expectSuccess()
      .customValidator((response: any) => {
        const text = response?.content?.[0]?.text;
        return text && text.includes('USD Coin');
      }, 'Should return USD Coin as name')
      .timeout(10000)
      .tags('erc20', 'metadata')
      .build()
  );

  testCases.push(
    createTestCase('erc20-002', 'Get Token Symbol')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.HIGH)
      .tool('erc20_getSymbol')
      .parameters({
        contractAddress: USDC_ADDRESS,
        provider: 'ethereum'
      })
      .expectSuccess()
      .customValidator((response: any) => {
        const text = response?.content?.[0]?.text;
        return text && text.includes('USDC');
      }, 'Should return USDC as symbol')
      .timeout(10000)
      .tags('erc20', 'metadata')
      .build()
  );

  testCases.push(
    createTestCase('erc20-003', 'Get Token Decimals')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.MEDIUM)
      .tool('erc20_getDecimals')
      .parameters({
        contractAddress: USDC_ADDRESS,
        provider: 'ethereum'
      })
      .expectSuccess()
      .customValidator((response: any) => {
        const text = response?.content?.[0]?.text;
        return text && text.includes('6'); // USDC has 6 decimals
      }, 'USDC should have 6 decimals')
      .timeout(10000)
      .tags('erc20', 'metadata')
      .build()
  );

  testCases.push(
    createTestCase('erc20-004', 'Get Token Balance')
      .category(TestCategory.TOOLS)
      .severity(TestSeverity.HIGH)
      .tool('erc20_getBalance')
      .parameters({
        contractAddress: USDC_ADDRESS,
        account: TEST_ACCOUNT,
        provider: 'ethereum'
      })
      .expectSuccess()
      .requireField('content')
      .timeout(10000)
      .tags('erc20', 'balance')
      .build()
  );

  return {
    id: 'erc20-test-suite',
    name: 'ERC20 Token Test Suite',
    description: 'Comprehensive tests for ERC20 token tools',
    testCases,
    timeout: 120000,
    tags: ['erc20', 'tokens']
  };
}

/**
 * Main test execution function
 */
async function runTests() {
  console.log('🚀 Starting MCP Test Framework Example\n');

  let client: MCPTestClient;
  let cleanup: (() => Promise<void>) | undefined;

  try {
    // Create and connect test client
    console.log('📡 Connecting to MCP server...');
    const clientSetup = await createTestClient({
      debug: false,
      timeout: 30000
    });
    client = clientSetup.client;
    cleanup = clientSetup.cleanup;

    // Validate server capabilities
    console.log('🔍 Validating server capabilities...');
    const capabilities = await client.validateCapabilities();
    console.log(`   ✓ Tools: ${capabilities.hasTools} (${capabilities.toolCount} available)`);
    console.log(`   ✓ Resources: ${capabilities.hasResources} (${capabilities.resourceCount} available)`);
    console.log(`   ✓ Prompts: ${capabilities.hasPrompts} (${capabilities.promptCount} available)\n`);

    // Create test runner
    const runner = new TestRunner(client, {
      parallel: false,  // Run tests sequentially for demo
      verbose: true,
      stopOnFailure: false,
      timeout: 30000
    });

    // Create reporter
    const reporter = new TestReporter({
      format: 'console',
      includeErrors: true,
      includeTiming: true,
      verbose: true
    });

    // Attach reporter to runner
    reporter.attachToRunner(runner);

    // Create and run comprehensive test suite
    console.log('📋 Creating test suites...\n');
    const comprehensiveSuite = await createComprehensiveTestSuite();
    const erc20Suite = await createERC20TestSuite();

    // Run comprehensive suite
    console.log('🧪 Running Comprehensive Test Suite...');
    const comprehensiveResults = await runner.runSuite(comprehensiveSuite);

    // Run ERC20 suite
    console.log('\n🧪 Running ERC20 Test Suite...');
    const erc20Results = await runner.runSuite(erc20Suite);

    // Generate reports
    console.log('\n📊 Generating Reports...\n');
    
    // Console report
    const consoleReport = await reporter.generateReport([comprehensiveResults, erc20Results]);
    console.log(consoleReport);

    // Save JSON report
    const jsonReporter = new TestReporter({
      format: 'json',
      includeResponses: false
    });
    const jsonReport = await jsonReporter.generateReport([comprehensiveResults, erc20Results]);
    await jsonReporter.saveReport(jsonReport, './reports/test-results.json');
    console.log('   ✓ JSON report saved to ./reports/test-results.json');

    // Save HTML report
    const htmlReporter = new TestReporter({
      format: 'html',
      includeErrors: true
    });
    const htmlReport = await htmlReporter.generateReport([comprehensiveResults, erc20Results]);
    await htmlReporter.saveReport(htmlReport, './reports/test-results.html');
    console.log('   ✓ HTML report saved to ./reports/test-results.html');

    // Save Markdown report
    const mdReporter = new TestReporter({
      format: 'markdown'
    });
    const mdReport = await mdReporter.generateReport([comprehensiveResults, erc20Results]);
    await mdReporter.saveReport(mdReport, './reports/test-results.md');
    console.log('   ✓ Markdown report saved to ./reports/test-results.md');

    // Save JUnit XML report (for CI/CD integration)
    const junitReporter = new TestReporter({
      format: 'junit'
    });
    const junitReport = await junitReporter.generateReport([comprehensiveResults, erc20Results]);
    await junitReporter.saveReport(junitReport, './reports/test-results.xml');
    console.log('   ✓ JUnit XML report saved to ./reports/test-results.xml');

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    if (cleanup) {
      await cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, createComprehensiveTestSuite, createERC20TestSuite };