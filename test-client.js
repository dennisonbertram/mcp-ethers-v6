import { McpStandardClient } from './build/src/tests/client/mcpStandardClient.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testProvider() {
  console.log('Starting MCP client test');
  
  // Create client
  const client = new McpStandardClient({
    clientName: "provider-debug-client",
    clientVersion: "1.0.0"
  });
  
  // Connect to the MCP server
  const transport = new StdioClientTransport('node', ['build/src/mcpServer.js']);
  await client.connect(transport);
  console.log('Connected to MCP server');
  
  try {
    // First try with network name
    console.log('Testing with provider name "MEGA Testnet"');
    const result1 = await client.callTool('getBlockNumber', {
      provider: 'MEGA Testnet'
    });
    console.log('Result:', result1);
  } catch (error) {
    console.error('Error with provider name:', error);
  }
  
  try {
    // Try with the network alias
    console.log('\nTesting with provider alias "mega"');
    const result2 = await client.callTool('getBlockNumber', {
      provider: 'mega'
    });
    console.log('Result:', result2);
  } catch (error) {
    console.error('Error with provider alias:', error);
  }
  
  try {
    // Try with direct RPC URL
    console.log('\nTesting with direct RPC URL');
    const result3 = await client.callTool('getBlockNumber', {
      provider: 'https://carrot.megaeth.com/rpc'
    });
    console.log('Result:', result3);
  } catch (error) {
    console.error('Error with RPC URL:', error);
  }
  
  // Disconnect
  await client.disconnect();
  console.log('Test complete');
}

testProvider().catch(console.error); 