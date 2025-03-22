/**
 * @file NFT Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script for NFT tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';
import { getTestReport, runTest } from '../report-generation.js';

async function testNFTTools() {
  console.log('Starting NFT tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    // Using a well-known NFT for testing (CryptoPunks on Ethereum mainnet)
    const contractAddress = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';
    const tokenId = '1'; // CryptoPunk #1
    
    // Test getNFTInfo
    await runTest(
      'NFT - Get NFT Info', 
      async () => {
        const result = await client.callTool({
          name: 'getNFTInfo',
          parameters: {
            contractAddress,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getNFTInfo');
        }
        
        console.log('NFT Info Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getNFTInfo tool with CryptoPunks contract'
    );
    
    // Test getNFTOwner
    await runTest(
      'NFT - Get NFT Owner', 
      async () => {
        const result = await client.callTool({
          name: 'getNFTOwner',
          parameters: {
            contractAddress,
            tokenId,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getNFTOwner');
        }
        
        console.log('NFT Owner Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getNFTOwner tool with CryptoPunk #1'
    );
    
    // Test getNFTTokenURI
    await runTest(
      'NFT - Get NFT Token URI', 
      async () => {
        const result = await client.callTool({
          name: 'getNFTTokenURI',
          parameters: {
            contractAddress,
            tokenId,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getNFTTokenURI');
        }
        
        console.log('NFT Token URI Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getNFTTokenURI tool with CryptoPunk #1'
    );
    
    // Test getNFTMetadata
    await runTest(
      'NFT - Get NFT Metadata', 
      async () => {
        const result = await client.callTool({
          name: 'getNFTMetadata',
          parameters: {
            contractAddress,
            tokenId,
            provider: 'mainnet'
          }
        });
        
        if (!result) {
          throw new Error('No response received from getNFTMetadata');
        }
        
        console.log('NFT Metadata Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getNFTMetadata tool with CryptoPunk #1'
    );
    
    console.log('\nNFT tools tests completed!');
  } catch (error) {
    console.error('Error testing NFT tools:', error);
  } finally {
    // Generate the summary
    getTestReport().generateSummary();
    
    // Cleanup resources
    cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNFTTools().catch(error => {
    console.error('Error running NFT tools test:', error);
    process.exit(1);
  });
}

export { testNFTTools }; 