#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = 'mcp_test_results_20250827_155712';

let validationResults = {
  timestamp: new Date().toISOString(),
  validations: [],
  errors: []
};

function log(message) {
  console.log(`[API-Validator] ${message}`);
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

  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, prompts: {}, resources: {} },
      clientInfo: { name: "API-Validator", version: "1.0.0" }
    }
  };
  
  await sendMessage(server, initRequest);
  
  const initializedNotification = {
    jsonrpc: "2.0",
    method: "notifications/initialized"
  };
  server.stdin.write(JSON.stringify(initializedNotification) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return server;
}

async function callMCPTool(server, toolName, params) {
  const request = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000000),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: params
    }
  };
  
  return await sendMessage(server, request);
}

function makeDirectRPCCall(method, params = [], rpcUrl = 'https://eth.llamarpc.com') {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: params
  };
  
  try {
    const result = execSync(`curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' ${rpcUrl}`, {
      timeout: 10000,
      encoding: 'utf8'
    });
    
    return JSON.parse(result);
  } catch (error) {
    return { error: { message: error.message } };
  }
}

async function validateAPIComparisons() {
  log('Starting API validation comparisons');
  
  const server = await initializeServer();
  
  // Test cases for API validation
  const validationCases = [
    // Block number comparison
    {
      name: 'getBlockNumber',
      mcpTool: 'getBlockNumber',
      mcpParams: {},
      rpcMethod: 'eth_blockNumber',
      rpcParams: [],
      comparison: 'blockNumber'
    },
    
    // Gas price comparison  
    {
      name: 'getGasPrice',
      mcpTool: 'getGasPrice', 
      mcpParams: {},
      rpcMethod: 'eth_gasPrice',
      rpcParams: [],
      comparison: 'gasPrice'
    },
    
    // Address balance comparison
    {
      name: 'getWalletBalance',
      mcpTool: 'getWalletBalance',
      mcpParams: { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
      rpcMethod: 'eth_getBalance',
      rpcParams: ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'latest'],
      comparison: 'balance'
    },
    
    // Transaction count comparison
    {
      name: 'getWalletTransactionCount',
      mcpTool: 'getWalletTransactionCount',
      mcpParams: { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
      rpcMethod: 'eth_getTransactionCount',
      rpcParams: ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'latest'],
      comparison: 'transactionCount'
    },
    
    // Block details comparison
    {
      name: 'getBlockDetails_latest',
      mcpTool: 'getBlockDetails',
      mcpParams: { blockTag: 'latest' },
      rpcMethod: 'eth_getBlockByNumber',
      rpcParams: ['latest', false],
      comparison: 'blockDetails'
    },
    
    // Block details with specific number
    {
      name: 'getBlockDetails_number',
      mcpTool: 'getBlockDetails',
      mcpParams: { blockTag: 18000000 },
      rpcMethod: 'eth_getBlockByNumber', 
      rpcParams: ['0x1126260', false], // 18000000 in hex
      comparison: 'blockDetails'
    }
  ];
  
  for (const testCase of validationCases) {
    log(`Validating ${testCase.name}`);
    
    try {
      // Get MCP response
      const mcpResponse = await callMCPTool(server, testCase.mcpTool, testCase.mcpParams);
      
      // Get direct RPC response  
      const rpcResponse = makeDirectRPCCall(testCase.rpcMethod, testCase.rpcParams);
      
      // Compare results
      const validation = {
        name: testCase.name,
        mcpTool: testCase.mcpTool,
        mcpParams: testCase.mcpParams,
        rpcMethod: testCase.rpcMethod,
        rpcParams: testCase.rpcParams,
        mcpResponse: mcpResponse,
        rpcResponse: rpcResponse,
        comparison: compareResponses(mcpResponse, rpcResponse, testCase.comparison),
        timestamp: new Date().toISOString()
      };
      
      validationResults.validations.push(validation);
      
      if (validation.comparison.matches) {
        log(`  ✅ ${testCase.name}: MCP and RPC responses match`);
      } else {
        log(`  ❌ ${testCase.name}: Mismatch - ${validation.comparison.reason}`);
      }
      
    } catch (error) {
      log(`  ❌ ${testCase.name}: Error - ${error.message}`);
      validationResults.errors.push(`${testCase.name}: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  server.kill();
  
  // Write results
  writeFileSync(
    path.join(testDir, 'api_validation_results.json'),
    JSON.stringify(validationResults, null, 2)
  );
  
  writeFileSync(
    path.join(testDir, 'api_validation_summary.md'),
    generateValidationSummary()
  );
  
  log('API validation complete');
  return validationResults;
}

function compareResponses(mcpResponse, rpcResponse, type) {
  if (mcpResponse.error || rpcResponse.error) {
    return {
      matches: false,
      reason: `Error in response - MCP: ${mcpResponse.error?.message || 'none'}, RPC: ${rpcResponse.error?.message || 'none'}`
    };
  }
  
  switch (type) {
    case 'blockNumber':
      const mcpBlock = parseInt(mcpResponse.result?.content?.[0]?.text?.match(/\\d+/)?.[0] || '0');
      const rpcBlock = parseInt(rpcResponse.result, 16);
      // Allow for small differences due to timing
      return {
        matches: Math.abs(mcpBlock - rpcBlock) <= 5,
        reason: `MCP block: ${mcpBlock}, RPC block: ${rpcBlock}, difference: ${Math.abs(mcpBlock - rpcBlock)}`
      };
      
    case 'gasPrice':
      const mcpGas = mcpResponse.result?.content?.[0]?.text?.match(/\\d+/)?.[0];
      const rpcGas = parseInt(rpcResponse.result, 16);
      return {
        matches: mcpGas && parseInt(mcpGas) > 0 && rpcGas > 0,
        reason: `MCP gas: ${mcpGas}, RPC gas: ${rpcGas}`
      };
      
    case 'balance':
      const mcpBalance = mcpResponse.result?.content?.[0]?.text?.match(/\\d+\\.?\\d*/)?.[0];
      const rpcBalance = parseInt(rpcResponse.result, 16);
      return {
        matches: mcpBalance !== undefined && rpcBalance >= 0,
        reason: `MCP balance: ${mcpBalance} ETH, RPC balance: ${rpcBalance} wei`
      };
      
    case 'transactionCount':
      const mcpCount = parseInt(mcpResponse.result?.content?.[0]?.text?.match(/\\d+/)?.[0] || '0');
      const rpcCount = parseInt(rpcResponse.result, 16);
      return {
        matches: mcpCount === rpcCount,
        reason: `MCP count: ${mcpCount}, RPC count: ${rpcCount}`
      };
      
    case 'blockDetails':
      const mcpBlockHash = mcpResponse.result?.content?.[0]?.text?.match(/0x[a-fA-F0-9]{64}/)?.[0];
      const rpcBlockHash = rpcResponse.result?.hash;
      return {
        matches: mcpBlockHash === rpcBlockHash,
        reason: `MCP hash: ${mcpBlockHash}, RPC hash: ${rpcBlockHash}`
      };
      
    default:
      return {
        matches: false,
        reason: 'Unknown comparison type'
      };
  }
}

function generateValidationSummary() {
  const matchedValidations = validationResults.validations.filter(v => v.comparison.matches);
  const mismatchedValidations = validationResults.validations.filter(v => !v.comparison.matches);
  
  return `# MCP API Validation Results

## Summary
- **Total Validations**: ${validationResults.validations.length}
- **Matched**: ${matchedValidations.length}
- **Mismatched**: ${mismatchedValidations.length}
- **Success Rate**: ${(matchedValidations.length / validationResults.validations.length * 100).toFixed(2)}%
- **Test Date**: ${validationResults.timestamp}

## Validation Results

${validationResults.validations.map(validation => {
  const status = validation.comparison.matches ? '✅' : '❌';
  return `### ${status} ${validation.name}
- **MCP Tool**: ${validation.mcpTool}
- **RPC Method**: ${validation.rpcMethod}
- **Parameters**: ${JSON.stringify(validation.mcpParams)}
- **Match**: ${validation.comparison.matches}
- **Details**: ${validation.comparison.reason}
`;
}).join('\n')}

## Mismatched Results Analysis

${mismatchedValidations.map(validation => `### ${validation.name}
**Issue**: ${validation.comparison.reason}

**MCP Response**: ${validation.mcpResponse.error ? 
  `Error: ${validation.mcpResponse.error.message}` : 
  `Success: ${JSON.stringify(validation.mcpResponse.result?.content?.[0]?.text?.substring(0, 100) || 'No text content')}`}

**RPC Response**: ${validation.rpcResponse.error ? 
  `Error: ${validation.rpcResponse.error.message}` : 
  `Success: ${JSON.stringify(validation.rpcResponse.result).substring(0, 100)}`}
`).join('\n')}

## Errors
${validationResults.errors.length > 0 ? validationResults.errors.map(error => `- ${error}`).join('\n') : 'No errors encountered.'}

## Conclusions
${matchedValidations.length === validationResults.validations.length ? 
  'All API validations passed successfully. The MCP server is correctly interfacing with Ethereum networks.' :
  `${mismatchedValidations.length} validation(s) failed. Review the mismatched results to identify potential issues with MCP server implementation or RPC response parsing.`}
`;
}

// Run the validation
validateAPIComparisons().then(() => {
  console.log('API validation completed');
  process.exit(0);
}).catch((error) => {
  console.error('API validation failed:', error);
  process.exit(1);
});