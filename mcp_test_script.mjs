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
    }, 5000);

    server.stdin.write(JSON.stringify(message) + '\n');
    
    const handler = (data) => {
      clearTimeout(timeout);
      server.stdout.off('data', handler);
      try {
        const response = JSON.parse(data.toString().trim());
        resolve(response);
      } catch (error) {
        reject(new Error(`Invalid JSON response: ${data.toString()}`));
      }
    };
    
    server.stdout.once('data', handler);
  });
}

async function testMCPServer() {
  log('Starting MCP server test');
  
  // Spawn the MCP server
  const server = spawn('node', ['build/src/mcpServer.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString()}`);
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
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

## Server Information
- **Name**: ${testResults.serverInfo?.name || 'Unknown'}
- **Version**: ${testResults.serverInfo?.version || 'Unknown'}
- **Protocol Version**: ${testResults.initialization?.result?.protocolVersion || 'Unknown'}

## Discovered Capabilities

### Tools (${tools.length})
${tools.map(tool => `- **${tool.name}**: ${tool.description || 'No description'}`).join('\n')}

### Prompts (${prompts.length})
${prompts.map(prompt => `- **${prompt.name}**: ${prompt.description || 'No description'}`).join('\n')}

### Resources (${resources.length})
${resources.map(resource => `- **${resource.name}**: ${resource.description || 'No description'}`).join('\n')}

## Test Strategy

### Phase 1: Tool Testing
Each tool will be tested with:
1. Valid parameter combinations
2. Invalid/missing parameters
3. Edge cases
4. API validation (where applicable)

### Phase 2: Prompt Testing
Each prompt will be tested with:
1. Required arguments
2. Optional arguments
3. Invalid arguments

### Phase 3: Resource Testing
Each resource will be tested for:
1. Accessibility
2. Content format
3. Data freshness

### Phase 4: Integration Testing
End-to-end workflows testing tool combinations.

## Error Analysis
${testResults.errors.length > 0 ? testResults.errors.map(error => `- ${error}`).join('\n') : 'No errors encountered during discovery.'}
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