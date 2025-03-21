/**
 * @file ERC20 Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script for ERC20 tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';

async function testERC20Tools() {
  console.log('Starting ERC20 tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    console.log('Testing getERC20TokenInfo tool...');
    
    // Use a well-known token for testing (DAI on Ethereum mainnet)
    const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    
    // Call the getERC20TokenInfo tool
    const tokenInfoResult = await client.callTool({
      name: 'getERC20TokenInfo',
      arguments: {
        tokenAddress,
        provider: 'mainnet'
      }
    });
    
    console.log('Token Info Result:', JSON.stringify(tokenInfoResult, null, 2));
    
    // Test getERC20Balance tool
    console.log('\nTesting getERC20Balance tool...');
    
    // Use a known address with DAI balance
    const ownerAddress = '0x4F868C1aa37fCf307ab38D215382e88FCA6275E2';
    
    const balanceResult = await client.callTool({
      name: 'getERC20Balance',
      arguments: {
        tokenAddress,
        ownerAddress,
        provider: 'mainnet'
      }
    });
    
    console.log('Balance Result:', JSON.stringify(balanceResult, null, 2));
    
    // Test getERC20Allowance tool
    console.log('\nTesting getERC20Allowance tool...');
    
    // Use a known spender for DAI (Uniswap V2 Router)
    const spenderAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    
    const allowanceResult = await client.callTool({
      name: 'getERC20Allowance',
      arguments: {
        tokenAddress,
        ownerAddress,
        spenderAddress,
        provider: 'mainnet'
      }
    });
    
    console.log('Allowance Result:', JSON.stringify(allowanceResult, null, 2));
    
    console.log('\nERC20 tools tests completed successfully!');
  } catch (error) {
    console.error('Error testing ERC20 tools:', error);
    process.exit(1);
  } finally {
    // Cleanup resources
    cleanup();
  }
}

// Run the tests
testERC20Tools().catch(err => {
  console.error('Unhandled error in ERC20 tools test:', err);
  process.exit(1);
}); 