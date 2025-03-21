/**
 * @file ERC721 Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script for ERC721 tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';

async function testERC721Tools() {
  console.log('Starting ERC721 tools test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    console.log('Testing getNFTInfo tool...');
    
    // Use a well-known NFT collection for testing (CryptoPunks on Ethereum mainnet)
    const contractAddress = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';
    
    // Call the getNFTInfo tool
    const nftInfoResult = await client.callTool({
      name: 'getNFTInfo',
      arguments: {
        contractAddress,
        provider: 'mainnet'
      }
    });
    
    console.log('NFT Info Result:', JSON.stringify(nftInfoResult, null, 2));
    
    // Test getNFTOwner tool
    console.log('\nTesting getNFTOwner tool...');
    
    // Use a known CryptoPunk ID
    const tokenId = '3100';
    
    const ownerResult = await client.callTool({
      name: 'getNFTOwner',
      arguments: {
        contractAddress,
        tokenId,
        provider: 'mainnet'
      }
    });
    
    console.log('NFT Owner Result:', JSON.stringify(ownerResult, null, 2));
    
    // Test getNFTTokenURI tool
    console.log('\nTesting getNFTTokenURI tool...');
    
    // CryptoPunks doesn't implement standard tokenURI, so let's use a different NFT
    // BAYC as an example
    const baycAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const baycTokenId = '8888';
    
    const tokenURIResult = await client.callTool({
      name: 'getNFTTokenURI',
      arguments: {
        contractAddress: baycAddress,
        tokenId: baycTokenId,
        provider: 'mainnet'
      }
    });
    
    console.log('NFT TokenURI Result:', JSON.stringify(tokenURIResult, null, 2));
    
    // Test getNFTMetadata tool
    console.log('\nTesting getNFTMetadata tool...');
    
    const metadataResult = await client.callTool({
      name: 'getNFTMetadata',
      arguments: {
        contractAddress: baycAddress,
        tokenId: baycTokenId,
        provider: 'mainnet'
      }
    });
    
    console.log('NFT Metadata Result:', JSON.stringify(metadataResult, null, 2));
    
    console.log('\nERC721 tools tests completed successfully!');
  } catch (error) {
    console.error('Error testing ERC721 tools:', error);
    process.exit(1);
  } finally {
    // Cleanup resources
    cleanup();
  }
}

// Run the tests
testERC721Tools().catch(err => {
  console.error('Unhandled error in ERC721 tools test:', err);
  process.exit(1);
}); 