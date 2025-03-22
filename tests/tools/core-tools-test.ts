/**
 * @file Core Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script for core tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';
import { getTestReport, runTest } from '../report-generation.js';

async function testCoreTools() {
  console.log('Starting Core tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    await runTest(
      'Core - Get Supported Networks', 
      async () => {
        const result = await client.callTool({
          name: 'getSupportedNetworks',
          parameters: {}
        });
        
        if (!result || !result.content) {
          throw new Error('Invalid response from getSupportedNetworks');
        }
        
        console.log('Supported Networks:', JSON.stringify(result, null, 2));
      },
      'Testing the getSupportedNetworks core tool'
    );
    
    // Generate wallet test
    await runTest(
      'Core - Generate Wallet', 
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
    
    // Check wallet exists test
    await runTest(
      'Core - Check Wallet Exists', 
      async () => {
        const result = await client.callTool({
          name: 'checkWalletExists',
          parameters: {}
        });
        
        if (!result) {
          throw new Error('No response received from checkWalletExists');
        }
        
        console.log('Check Wallet Exists Result:', JSON.stringify(result, null, 2));
      },
      'Testing the checkWalletExists tool'
    );
    
    // Get wallet balance test
    await runTest(
      'Core - Get Wallet Balance', 
      async () => {
        // Use a known Ethereum address
        const knownAddress = '0x4F868C1aa37fCf307ab38D215382e88FCA6275E2';
        
        const result = await client.callTool({
          name: 'getWalletBalance',
          parameters: {
            address: knownAddress,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getWalletBalance');
        }
        
        console.log('Get Wallet Balance Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getWalletBalance tool'
    );
    
    console.log('\nCore tools tests completed!');
  } catch (error) {
    console.error('Error testing Core tools:', error);
  } finally {
    // Generate the summary
    getTestReport().generateSummary();
    
    // Cleanup resources
    cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCoreTools().catch(error => {
    console.error('Error running Core tools test:', error);
    process.exit(1);
  });
}

export { testCoreTools }; 