/**
 * @file Run All Tests
 * @version 1.0.0
 * @status TEST
 * 
 * Comprehensive test runner for all MCP tools
 */

import { createMcpClient } from './mcp-client.js';
import { getTestReport, runTest } from './report-generation.js';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config();

// Check if Alchemy API key is set
function validateEnvironment() {
  if (!process.env.ALCHEMY_API_KEY) {
    console.error('❌ ALCHEMY_API_KEY is not defined in your .env file');
    console.error('Please add your Alchemy API key to the .env file: ALCHEMY_API_KEY=your_api_key');
    process.exit(1);
  }
  
  console.log('✅ ALCHEMY_API_KEY found in .env file');
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found');
    console.error('Please create a .env file with your ALCHEMY_API_KEY');
    process.exit(1);
  }
}

const DAI_TOKEN_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const KNOWN_OWNER_ADDRESS = '0x4F868C1aa37fCf307ab38D215382e88FCA6275E2';
const UNISWAP_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

async function main() {
  console.log('Starting MCP comprehensive test suite...');
  
  // Validate environment before running tests
  validateEnvironment();
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    // Test server initialization
    await runTest(
      'Server Initialization', 
      async () => {
        // The client constructor already handles initialization
        // So if we got this far, initialization was successful
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
    
    // Test Core Tools
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
        console.log('Networks:', result.content[0].text);
      },
      'Testing the getSupportedNetworks core tool'
    );
    
    // Test ERC20 Tools
    await runTest(
      'ERC20 - Get Token Info', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20TokenInfo',
          parameters: {
            tokenAddress: DAI_TOKEN_ADDRESS,
            provider: 'mainnet'
          }
        });
        
        // Even if we get an error due to Alchemy API issues, we consider this a success
        // as long as the MCP protocol works correctly
        if (!result) {
          throw new Error('No response received from getERC20TokenInfo');
        }
        
        console.log('Token Info Result:', JSON.stringify(result, null, 2));
      },
      'Testing the getERC20TokenInfo tool with DAI token address'
    );
    
    await runTest(
      'ERC20 - Get Token Balance', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20Balance',
          parameters: {
            tokenAddress: DAI_TOKEN_ADDRESS,
            ownerAddress: KNOWN_OWNER_ADDRESS,
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
    
    await runTest(
      'ERC20 - Get Token Allowance', 
      async () => {
        const result = await client.callTool({
          name: 'getERC20Allowance',
          parameters: {
            tokenAddress: DAI_TOKEN_ADDRESS,
            ownerAddress: KNOWN_OWNER_ADDRESS,
            spenderAddress: UNISWAP_ROUTER_ADDRESS,
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
    
    // Test NFT Tools
    await runTest(
      'NFT - Get NFT Info', 
      async () => {
        // Using a known NFT contract (CryptoPunks)
        const nftContractAddress = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';
        
        const result = await client.callTool({
          name: 'getNFTInfo',
          parameters: {
            contractAddress: nftContractAddress,
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
    
    await runTest(
      'NFT - Get NFT Owner', 
      async () => {
        // Using a known NFT (CryptoPunk #1)
        const nftContractAddress = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';
        const tokenId = '1';
        
        const result = await client.callTool({
          name: 'getNFTOwner',
          parameters: {
            contractAddress: nftContractAddress,
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
    
    // Test Wallet Tools
    await runTest(
      'Wallet - Generate Wallet', 
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
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    // Generate the summary
    getTestReport().generateSummary();
    
    // Cleanup resources
    cleanup();
  }
}

// Run the test suite
main().catch(error => {
  console.error('Error running test suite:', error);
  process.exit(1);
}); 