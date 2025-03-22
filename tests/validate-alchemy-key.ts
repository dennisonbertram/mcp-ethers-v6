/**
 * @file Validate Alchemy API Key
 * @version 1.0.0
 * @status TEST
 * 
 * Script to validate the Alchemy API key by making a direct API call
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

async function validateAlchemyKey() {
  console.log('Validating Alchemy API key...');
  
  const apiKey = process.env.ALCHEMY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: ALCHEMY_API_KEY not found in environment variables');
    console.error('Please make sure you have a .env file with ALCHEMY_API_KEY set');
    process.exit(1);
  }
  
  console.log(`Testing Alchemy API key: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Different endpoint formats to try
  const endpointFormats = [
    `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,  // Modern format
    `https://eth-mainnet.alchemyapi.io/v2/${apiKey}`,  // Legacy format
    `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`, // Try Polygon instead
    `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`,  // Try Arbitrum instead
    `https://polygonzkevm-mainnet.g.alchemy.com/v2/${apiKey}`  // Try a zkEVM network
  ];
  
  let lastError = null;
  
  for (const url of endpointFormats) {
    try {
      // Try this endpoint
      console.log(`Trying endpoint: ${url.replace(apiKey, '***')}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`Error with this endpoint: ${JSON.stringify(data.error)}`);
        lastError = data.error;
        continue;
      }
      
      if (data.result) {
        const blockNumber = parseInt(data.result, 16);
        console.log('✅ Alchemy API key is valid and working!');
        console.log(`Successfully fetched latest block number: ${blockNumber}`);
        console.log(`Working endpoint: ${url.replace(apiKey, '***')}`);
        return; // Success, exit the function
      }
    } catch (error) {
      console.log(`Network error with this endpoint: ${error.message}`);
      lastError = error;
    }
  }
  
  // If we get here, none of the endpoints worked
  console.error('❌ Alchemy API key validation failed on all endpoints');
  if (lastError) {
    console.error(`Last error: ${JSON.stringify(lastError)}`);
  }
  console.error('\nPlease check your Alchemy API key and make sure it is active');
  console.error('You can create a new API key at https://dashboard.alchemy.com/');
  process.exit(1);
}

// Run the validation if this file is executed directly
if (require.main === module) {
  validateAlchemyKey().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { validateAlchemyKey }; 