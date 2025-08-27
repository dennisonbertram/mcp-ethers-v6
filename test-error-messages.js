/**
 * Test script to verify improved error messages
 */

const { Client } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { spawn } = require("child_process");
const path = require("path");

async function testErrorMessages() {
  console.log("Testing improved error messages...\n");
  
  // Start the MCP server
  const serverPath = path.join(__dirname, "build/src/index.js");
  const serverProcess = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  
  // Create MCP client
  const client = new Client({
    name: "error-test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });
  
  await client.connect({
    readable: serverProcess.stdout,
    writable: serverProcess.stdin
  });

  console.log("Connected to MCP server\n");

  // Test cases for improved error messages
  const testCases = [
    {
      name: "Missing required parameter",
      tool: "getERC20Balance",
      params: {
        tokenAddress: "0x123" // Invalid address format
      },
      expectedError: "Invalid Ethereum address"
    },
    {
      name: "Invalid address format",
      tool: "getWalletBalance",
      params: {
        address: "not-an-address"
      },
      expectedError: "Invalid Ethereum address format"
    },
    {
      name: "Invalid network name",
      tool: "getNetwork",
      params: {
        name: "invalid-network"
      },
      expectedError: "Network 'invalid-network' not found"
    },
    {
      name: "Missing token address",
      tool: "getERC20TokenInfo",
      params: {},
      expectedError: "Missing required parameter"
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Tool: ${testCase.tool}`);
    console.log(`Params:`, JSON.stringify(testCase.params, null, 2));
    
    try {
      const result = await client.request({
        method: "tools/call",
        params: {
          name: testCase.tool,
          arguments: testCase.params
        }
      });
      
      if (result.isError) {
        const errorMessage = result.content[0]?.text || "";
        console.log(`Error received: ${errorMessage}`);
        
        if (errorMessage.includes(testCase.expectedError)) {
          console.log(`✅ Test passed - Got expected user-friendly error\n`);
        } else {
          console.log(`❌ Test failed - Error doesn't match expected\n`);
        }
      } else {
        console.log(`❌ Test failed - Expected error but got success\n`);
      }
    } catch (error) {
      console.log(`Error calling tool: ${error.message}\n`);
    }
  }

  // Clean up
  await client.close();
  serverProcess.kill();
  
  console.log("Testing complete!");
}

testErrorMessages().catch(console.error);