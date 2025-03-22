/**
 * @file Basic Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Basic test script for MCP tools that don't require active API keys
 */

import { createMcpClient } from '../mcp-client.js';
import { getTestReport, runTest } from '../report-generation.js';

async function testBasicTools() {
  console.log('Starting basic tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    // Test server initialization
    await runTest(
      'Server Initialization', 
      async () => {
        // The client constructor already handles initialization
        // So if we got this far, initialization was successful
        console.log('Server initialized successfully');
      },
      'Testing if the MCP server initializes correctly'
    );
    
    // Test tool listing
    await runTest(
      'Tool Listing', 
      async () => {
        const toolsResult = await client.listTools();
        if (!toolsResult.tools || toolsResult.tools.length === 0) {
          throw new Error('No tools available from the server');
        }
        console.log(`Found ${toolsResult.tools.length} tools`);
      },
      'Testing if the server returns a list of available tools'
    );
    
    // Test wallet generation (doesn't require Alchemy)
    await runTest(
      'Generate Wallet', 
      async () => {
        const result = await client.callTool({
          name: 'generateWallet',
          parameters: {}
        });
        
        if (!result) {
          throw new Error('No response received from generateWallet');
        }
        
        console.log('Generate Wallet Result:', JSON.stringify(result, null, 2));
      },
      'Testing the generateWallet tool'
    );
    
    console.log('\nBasic tools tests completed successfully!');
  } catch (error) {
    console.error('Error testing basic tools:', error);
  } finally {
    // Generate the summary
    getTestReport().generateSummary();
    
    // Cleanup resources
    cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBasicTools().catch(error => {
    console.error('Error running basic tools test:', error);
    process.exit(1);
  });
}

export { testBasicTools }; 