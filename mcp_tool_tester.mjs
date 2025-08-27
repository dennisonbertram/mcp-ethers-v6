#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = 'mcp_test_results_20250827_155712';

// Load discovery results
const discoveryResults = JSON.parse(readFileSync(path.join(testDir, 'discovery_results.json'), 'utf8'));
const tools = discoveryResults.tools.result.tools;

let testResults = {
  timestamp: new Date().toISOString(),
  totalTools: tools.length,
  testedTools: 0,
  passedTools: 0,
  failedTools: 0,
  skippedTools: 0,
  results: {},
  errors: []
};

function log(message) {
  console.log(`[Tool-Tester] ${message}`);
}

function sendMessage(server, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Response timeout'));
    }, 15000);

    let buffer = '';
    let responseReceived = false;
    
    const handler = (data) => {
      buffer += data.toString();
      
      const lines = buffer.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.startsWith('{') && !responseReceived) {
          try {
            const response = JSON.parse(line);
            if (response.jsonrpc === '2.0' && ('result' in response || 'error' in response)) {
              clearTimeout(timeout);
              server.stdout.off('data', handler);
              responseReceived = true;
              resolve(response);
              return;
            }
          } catch (error) {
            continue;
          }
        }
      }
    };
    
    server.stdout.on('data', handler);
    server.stdin.write(JSON.stringify(message) + '\n');
  });
}

async function initializeServer() {
  const server = spawn('node', ['build/src/mcpServer.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Initialize the server
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, prompts: {}, resources: {} },
      clientInfo: { name: "Tool-Tester", version: "1.0.0" }
    }
  };
  
  await sendMessage(server, initRequest);
  
  // Send initialized notification
  const initializedNotification = {
    jsonrpc: "2.0",
    method: "notifications/initialized"
  };
  server.stdin.write(JSON.stringify(initializedNotification) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return server;
}

// Test cases for different tool categories
const testCases = {
  // Basic network tools - no parameters required
  'getSupportedNetworks': [],
  'getAllNetworks': [],
  
  // Network query tools - optional provider
  'getBlockNumber': [
    {},
    { provider: 'ethereum' },
    { chainId: 1 }
  ],
  
  'getGasPrice': [
    {},
    { provider: 'polygon' }
  ],
  
  'getFeeData': [
    {},
    { provider: 'ethereum' }
  ],
  
  // Wallet generation (safe)
  'generateWallet': [
    {},
    { saveToEnv: false }
  ],
  
  // Address queries (using known addresses)
  'getWalletBalance': [
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' } // Vitalik's address
  ],
  
  'getWalletTransactionCount': [
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }
  ],
  
  // Block queries
  'getBlockDetails': [
    { blockTag: 'latest' },
    { blockTag: 18000000 }
  ],
  
  // Utility functions
  'formatEther': [
    { wei: '1000000000000000000' },
    { wei: '500000000000000000' }
  ],
  
  'parseEther': [
    { ether: '1.0' },
    { ether: '0.5' }
  ],
  
  'formatUnits': [
    { value: '1000000', unit: 6 },
    { value: '1000000000', unit: 'gwei' }
  ],
  
  // Contract queries (using known contracts)
  'getContractCode': [
    { address: '0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628' } // USDC on Ethereum
  ],
  
  // ENS resolution
  'resolveName': [
    { name: 'vitalik.eth' },
    { name: 'ethereum.eth' }
  ],
  
  'lookupAddress': [
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }
  ],
  
  // ERC20 queries (using USDC)
  'getERC20TokenInfo': [
    { contractAddress: '0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628' }
  ],
  
  'getERC20Balance': [
    { 
      tokenAddress: '0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628',
      userAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    }
  ],
  
  // Network tools
  'getNetwork': [
    { networkName: 'ethereum' },
    { networkName: 'polygon' }
  ]
};

async function testTool(server, tool, testCaseParams) {
  const toolName = tool.name;
  log(`Testing ${toolName} with params: ${JSON.stringify(testCaseParams)}`);
  
  const request = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000000),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: testCaseParams
    }
  };
  
  try {
    const response = await sendMessage(server, request);
    
    if (response.error) {
      return {
        success: false,
        error: response.error,
        response
      };
    }
    
    if (response.result && response.result.isError) {
      return {
        success: false,
        toolError: response.result.content,
        response
      };
    }
    
    return {
      success: true,
      result: response.result,
      response
    };
    
  } catch (error) {
    return {
      success: false,
      exception: error.message,
      error
    };
  }
}

async function testAllTools() {
  log('Starting comprehensive tool testing');
  
  const server = await initializeServer();
  
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const toolName = tool.name;
    
    testResults.testedTools++;
    testResults.results[toolName] = {
      description: tool.description,
      inputSchema: tool.inputSchema,
      testCases: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
    
    log(`[${i + 1}/${tools.length}] Testing tool: ${toolName}`);
    
    // Get test cases for this tool
    const cases = testCases[toolName] || [{}]; // Default to empty params
    
    for (let j = 0; j < cases.length; j++) {
      const testCase = cases[j];
      testResults.results[toolName].summary.total++;
      
      const result = await testTool(server, tool, testCase);
      
      testResults.results[toolName].testCases.push({
        params: testCase,
        ...result,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        testResults.results[toolName].summary.passed++;
        log(`  ✅ Test case ${j + 1}: PASSED`);
      } else {
        testResults.results[toolName].summary.failed++;
        log(`  ❌ Test case ${j + 1}: FAILED - ${result.error?.message || result.exception || 'Tool error'}`);
      }
      
      // Short delay between test cases
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update overall stats
    if (testResults.results[toolName].summary.passed > 0) {
      testResults.passedTools++;
    } else {
      testResults.failedTools++;
    }
    
    // Short delay between tools
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  server.kill();
  
  // Write results
  writeFileSync(
    path.join(testDir, 'tool_test_results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  // Generate summary report
  writeFileSync(
    path.join(testDir, 'tool_test_summary.md'),
    generateSummaryReport()
  );
  
  log('Tool testing complete');
  return testResults;
}

function generateSummaryReport() {
  const passRate = (testResults.passedTools / testResults.totalTools * 100).toFixed(2);
  
  return `# MCP Tool Testing Results

## Summary
- **Total Tools**: ${testResults.totalTools}
- **Tools Tested**: ${testResults.testedTools}
- **Tools Passed**: ${testResults.passedTools}
- **Tools Failed**: ${testResults.failedTools}
- **Pass Rate**: ${passRate}%
- **Test Date**: ${testResults.timestamp}

## Tool Results

${Object.entries(testResults.results).map(([toolName, result]) => {
  const status = result.summary.passed > 0 ? '✅' : '❌';
  return `### ${status} ${toolName}
- **Passed**: ${result.summary.passed}/${result.summary.total} test cases
- **Description**: ${result.description || 'No description'}

${result.testCases.map((testCase, index) => {
  const caseStatus = testCase.success ? '✅' : '❌';
  const error = testCase.error?.message || testCase.exception || (testCase.toolError ? 'Tool returned error' : '');
  return `  ${caseStatus} Test ${index + 1}: ${JSON.stringify(testCase.params)} ${error ? `(${error})` : ''}`;
}).join('\n')}
`;
}).join('\n')}

## Failed Tools Analysis

${Object.entries(testResults.results)
  .filter(([_, result]) => result.summary.passed === 0)
  .map(([toolName, result]) => `### ${toolName}
${result.testCases.map(testCase => 
  `- Error: ${testCase.error?.message || testCase.exception || 'Tool error'}`
).join('\n')}
`).join('\n')}

## Recommendations

1. **High Priority Fixes**: Address tools that fail basic functionality tests
2. **Network Connectivity**: Many failures may be due to network/RPC issues
3. **Authentication**: Some tools may require API keys or wallet setup
4. **Parameter Validation**: Review input schema validation for failed tools
`;
}

// Run the tests
testAllTools().then(() => {
  console.log('All tool testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('Tool testing failed:', error);
  process.exit(1);
});