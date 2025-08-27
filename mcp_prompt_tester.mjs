#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = 'mcp_test_results_20250827_155712';

let testResults = {
  timestamp: new Date().toISOString(),
  promptTests: [],
  errors: []
};

function log(message) {
  console.log(`[Prompt-Tester] ${message}`);
}

function sendMessage(server, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Response timeout'));
    }, 10000);

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
      clientInfo: { name: "Prompt-Tester", version: "1.0.0" }
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

async function testPrompts() {
  log('Starting prompt testing');
  
  const server = await initializeServer();
  
  try {
    // Test the ENS resolution prompt
    log('Testing ENS resolution prompt');
    const promptRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "prompts/get",
      params: {
        name: "resolveEnsAcrossNetworks",
        arguments: {
          ensName: "vitalik.eth",
          targetNetwork: "polygon",
          operation: "balance"
        }
      }
    };
    
    const promptResponse = await sendMessage(server, promptRequest);
    
    testResults.promptTests.push({
      promptName: "resolveEnsAcrossNetworks",
      arguments: {
        ensName: "vitalik.eth",
        targetNetwork: "polygon", 
        operation: "balance"
      },
      success: !promptResponse.error,
      response: promptResponse,
      timestamp: new Date().toISOString()
    });
    
    if (promptResponse.error) {
      log(`❌ ENS prompt test failed: ${promptResponse.error.message}`);
    } else {
      log(`✅ ENS prompt test passed`);
      log(`Prompt description: ${promptResponse.result.description || 'No description'}`);
      log(`Messages returned: ${promptResponse.result.messages?.length || 0}`);
    }
    
  } catch (error) {
    log(`Prompt testing error: ${error.message}`);
    testResults.errors.push(`Prompt test error: ${error.message}`);
  } finally {
    server.kill();
  }
  
  // Write results
  writeFileSync(
    path.join(testDir, 'prompt_test_results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  writeFileSync(
    path.join(testDir, 'prompt_test_summary.md'),
    generatePromptSummary()
  );
  
  log('Prompt testing complete');
  return testResults;
}

function generatePromptSummary() {
  const passedTests = testResults.promptTests.filter(test => test.success);
  const failedTests = testResults.promptTests.filter(test => !test.success);
  
  return `# MCP Prompt Testing Results

## Summary
- **Total Prompts**: ${testResults.promptTests.length}
- **Passed**: ${passedTests.length}
- **Failed**: ${failedTests.length}
- **Test Date**: ${testResults.timestamp}

## Test Results

${testResults.promptTests.map(test => {
  const status = test.success ? '✅' : '❌';
  return `### ${status} ${test.promptName}
- **Arguments**: ${JSON.stringify(test.arguments)}
- **Success**: ${test.success}
${test.success ? 
  `- **Description**: ${test.response.result?.description || 'No description'}
- **Messages**: ${test.response.result?.messages?.length || 0} messages returned` :
  `- **Error**: ${test.response.error?.message || 'Unknown error'}`
}
`;
}).join('\n')}

## Errors
${testResults.errors.length > 0 ? testResults.errors.map(error => `- ${error}`).join('\n') : 'No errors encountered.'}
`;
}

// Run the tests
testPrompts().then(() => {
  console.log('Prompt testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('Prompt testing failed:', error);
  process.exit(1);
});