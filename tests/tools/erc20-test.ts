/**
 * @file ERC20 Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script for ERC20 tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';
import { getTestReport, runTest } from '../report-generation.js';

async function testERC20Tools() {
  console.log('Starting ERC20 tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    // Use a well-known token for testing (DAI on Ethereum mainnet)
    const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    // Use a known address with DAI balance
    const ownerAddress = '0x4F868C1aa37fCf307ab38D215382e88FCA6275E2';
    // Use a known spender for DAI (Uniswap V2 Router)
    const spenderAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    
    // Test getERC20TokenInfo
    await runTest(
      'ERC20 - Get Token Info', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20TokenInfo',
          parameters: {
            tokenAddress,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getERC20TokenInfo');
        }
        
        console.log('Token Info Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getERC20TokenInfo tool with DAI token address'
    );
    
    // Test getERC20Balance
    await runTest(
      'ERC20 - Get Token Balance', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20Balance',
          parameters: {
            tokenAddress,
            ownerAddress,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getERC20Balance');
        }
        
        console.log('Balance Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getERC20Balance tool with a known address'
    );
    
    // Test getERC20Allowance
    await runTest(
      'ERC20 - Get Token Allowance', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20Allowance',
          parameters: {
            tokenAddress,
            ownerAddress,
            spenderAddress,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getERC20Allowance');
        }
        
        console.log('Allowance Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getERC20Allowance tool with a known spender'
    );
    
    console.log('\nERC20 tools tests completed!');
  } catch (error) {
    console.error('Error testing ERC20 tools:', error);
  } finally {
    // Generate the summary
    getTestReport().generateSummary();
    
    // Cleanup resources
    cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testERC20Tools().catch(error => {
    console.error('Error running ERC20 tools test:', error);
    process.exit(1);
  });
}

export { testERC20Tools }; 