#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results directory
const testDir = 'mcp_test_results_20250827_155712';

// Track test results
const testResults = {
  timestamp: new Date().toISOString(),
  serverInfo: null,
  initialization: null,
  tools: null,
  prompts: null,
  resources: null,
  errors: []
};

function log(message) {
  console.log(`[MCP-Tester] ${message}`);
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
      
      // Look for complete JSON response
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
            // Not a complete JSON yet, continue buffering
            continue;
          }
        }
      }
    };
    
    server.stdout.on('data', handler);
    server.stdin.write(JSON.stringify(message) + '\n');
  });
}

async function testMCPServer() {
  log('Starting MCP server test');
  
  // Spawn the MCP server
  const server = spawn('node', ['build/src/mcpServer.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverLogs = '';
  server.stderr.on('data', (data) => {
    serverLogs += data.toString();
  });
  
  server.on('error', (error) => {
    log(`Server error: ${error.message}`);
    testResults.errors.push(`Server spawn error: ${error.message}`);
  });

  try {
    // Step 1: Initialize
    log('Sending initialize request');
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        },
        clientInfo: {
          name: "MCP-Tester",
          version: "1.0.0"
        }
      }
    };
    
    const initResponse = await sendMessage(server, initRequest);
    log('Initialize response received');
    testResults.initialization = initResponse;
    testResults.serverInfo = initResponse.result?.serverInfo;
    
    // Step 2: Send initialized notification
    log('Sending initialized notification');
    const initializedNotification = {
      jsonrpc: "2.0",
      method: "notifications/initialized"
    };
    server.stdin.write(JSON.stringify(initializedNotification) + '\n');
    
    // Wait a moment for server to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: List tools
    log('Requesting tools list');
    const toolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list"
    };
    
    const toolsResponse = await sendMessage(server, toolsRequest);
    log(`Tools response received: ${toolsResponse.result?.tools?.length || 0} tools found`);
    testResults.tools = toolsResponse;
    
    // Step 4: List prompts
    log('Requesting prompts list');
    const promptsRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "prompts/list"
    };
    
    const promptsResponse = await sendMessage(server, promptsRequest);
    log(`Prompts response received: ${promptsResponse.result?.prompts?.length || 0} prompts found`);
    testResults.prompts = promptsResponse;
    
    // Step 5: List resources (if supported)
    log('Requesting resources list');
    const resourcesRequest = {
      jsonrpc: "2.0",
      id: 4,
      method: "resources/list"
    };
    
    try {
      const resourcesResponse = await sendMessage(server, resourcesRequest);
      log(`Resources response received: ${resourcesResponse.result?.resources?.length || 0} resources found`);
      testResults.resources = resourcesResponse;
    } catch (error) {
      log(`Resources not supported or error: ${error.message}`);
      testResults.resources = { error: error.message };
    }
    
  } catch (error) {
    log(`Test error: ${error.message}`);
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    server.kill();
    
    // Save server logs
    writeFileSync(path.join(testDir, 'server_logs.txt'), serverLogs);
  }
  
  // Write results to files
  writeFileSync(path.join(testDir, 'test_plan.md'), generateTestPlan());
  writeFileSync(path.join(testDir, 'discovery_results.json'), JSON.stringify(testResults, null, 2));
  
  log('Test complete - results written to files');
  
  return testResults;
}

function generateTestPlan() {
  const tools = testResults.tools?.result?.tools || [];
  const prompts = testResults.prompts?.result?.prompts || [];
  const resources = testResults.resources?.result?.resources || [];
  
  return `# MCP Server Test Plan

## Test Results Summary
- **Timestamp**: ${testResults.timestamp}
- **Server Status**: ${testResults.initialization ? 'Connected' : 'Failed'}
- **Protocol Version**: ${testResults.initialization?.result?.protocolVersion || 'Unknown'}

## Server Information
- **Name**: ${testResults.serverInfo?.name || 'Unknown'}
- **Version**: ${testResults.serverInfo?.version || 'Unknown'}

## Discovered Capabilities

### Tools (${tools.length})
${tools.map((tool, index) => `${index + 1}. **${tool.name}**: ${tool.description || 'No description'}
   - Input Schema: ${tool.inputSchema ? 'Available' : 'Missing'}`).join('\n')}

### Prompts (${prompts.length})
${prompts.map((prompt, index) => `${index + 1}. **${prompt.name}**: ${prompt.description || 'No description'}`).join('\n')}

### Resources (${resources.length})
${resources.length > 0 ? resources.map((resource, index) => `${index + 1}. **${resource.name}**: ${resource.description || 'No description'}`).join('\n') : 'No resources discovered'}

## Test Strategy

### Phase 1: Core Tool Testing
${tools.filter(t => ['getSupportedNetworks', 'getBlockNumber', 'getGasPrice', 'getFeeData'].includes(t.name))
  .map(t => `- **${t.name}**: Basic network operation test`).join('\n')}

### Phase 2: Wallet Tool Testing
${tools.filter(t => ['generateWallet', 'loadWallet', 'checkWalletExists', 'getWalletBalance'].includes(t.name))
  .map(t => `- **${t.name}**: Wallet management test`).join('\n')}

### Phase 3: Utility Tool Testing
${tools.filter(t => ['formatEther', 'parseEther', 'formatUnits'].includes(t.name))
  .map(t => `- **${t.name}**: Utility function test`).join('\n')}

### Phase 4: Contract Tool Testing
${tools.filter(t => t.name.includes('contract') || t.name.includes('Contract'))
  .map(t => `- **${t.name}**: Contract interaction test`).join('\n')}

### Phase 5: ERC Token Testing
${tools.filter(t => t.name.includes('ERC') || t.name.includes('erc'))
  .map(t => `- **${t.name}**: Token standard test`).join('\n')}

## Error Analysis
${testResults.errors.length > 0 ? testResults.errors.map((error, index) => `${index + 1}. ${error}`).join('\n') : 'No errors encountered during discovery.'}

## Next Steps
1. Test each tool individually with valid parameters
2. Test error handling with invalid parameters
3. Test API integrations (Ethereum network calls)
4. Performance and reliability testing
5. End-to-end workflow testing
`;
}

// Run the test
testMCPServer().then(() => {
  console.log('Test completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});