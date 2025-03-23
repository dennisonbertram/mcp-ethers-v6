import { McpStandardClient } from './build/src/tests/client/mcpStandardClient.js';

async function testNetworkTools() {
  console.log('Starting Network Tools Test');
  
  // Create client
  const client = new McpStandardClient({
    clientName: "network-tools-test-client",
    clientVersion: "1.0.0",
    serverArgs: ['build/src/mcpServer.js']
  });
  
  // Connect to the MCP server
  await client.connect();
  console.log('Connected to MCP server');
  
  try {
    // List available tools
    console.log('\nListing available tools to verify our server is working');
    const tools = await client.listTools();
    if (tools && tools.tools) {
      console.log(`Available tools: ${tools.tools.length} tools found`);
      
      // Check if our network tools are in the list
      const networkTools = tools.tools.filter(tool => 
        tool.name === 'getAllNetworks' || tool.name === 'getNetwork'
      );
      
      console.log(`Network tools found: ${networkTools.length}`);
    } else {
      console.log('No tools found or unexpected response format');
    }
    
    // Test getting all networks
    console.log('\nTesting getAllNetworks tool');
    const allNetworksResult = await client.callTool('getAllNetworks', {});
    
    if (allNetworksResult && allNetworksResult.content && allNetworksResult.content.length > 0) {
      // Parse and validate the JSON response
      const networks = JSON.parse(allNetworksResult.content[0].text);
      console.log(`Successfully fetched ${networks.length} networks`);
      
      // Display a few networks as examples
      const examples = networks.slice(0, 3);
      console.log('Sample networks:');
      examples.forEach(network => {
        console.log(`- ${network.name} (Chain ID: ${network.chainId}, Token: ${network.nativeToken})`);
      });
    } else {
      console.error('Failed to get network list');
      console.log('Raw response:', JSON.stringify(allNetworksResult));
    }
    
    // Test fetching a specific network
    console.log('\nTesting getNetwork tool for Ethereum');
    const networkResult = await client.callTool('getNetwork', {
      name: 'ethereum'
    });
    
    if (networkResult && networkResult.content && networkResult.content.length > 0) {
      const network = JSON.parse(networkResult.content[0].text);
      if (network.error) {
        console.error(`Error: ${network.error}`);
      } else {
        console.log('Network details:');
        console.log(`- Name: ${network.name}`);
        console.log(`- Chain ID: ${network.chainId}`);
        console.log(`- Native Token: ${network.nativeToken}`);
        console.log(`- RPC URL: ${network.rpcUrl}`);
      }
    } else {
      console.error('Failed to get specific network');
      console.log('Raw response:', JSON.stringify(networkResult));
    }
    
    // Test with a more recently added network
    console.log('\nTesting getNetwork tool for MEGA Testnet');
    const megaResult = await client.callTool('getNetwork', {
      name: 'mega testnet'
    });
    
    if (megaResult && megaResult.content && megaResult.content.length > 0) {
      const network = JSON.parse(megaResult.content[0].text);
      if (network.error) {
        console.error(`Error: ${network.error}`);
      } else {
        console.log('Network details:');
        console.log(`- Name: ${network.name}`);
        console.log(`- Chain ID: ${network.chainId}`);
        console.log(`- Native Token: ${network.nativeToken}`);
        console.log(`- RPC URL: ${network.rpcUrl}`);
      }
    } else {
      console.error('Failed to get MEGA Testnet info');
      console.log('Raw response:', JSON.stringify(megaResult));
    }
    
    // Test fetching with an invalid network name
    console.log('\nTesting getNetwork with invalid network name');
    const invalidResult = await client.callTool('getNetwork', {
      name: 'nonexistent'
    });
    
    if (invalidResult && invalidResult.isError) {
      console.log('Got expected error for nonexistent network');
      const content = invalidResult.content && invalidResult.content[0] ? 
                    invalidResult.content[0].text : '';
      
      if (content) {
        try {
          const errorData = JSON.parse(content);
          console.log(`Error message: ${errorData.error}`);
        } catch (e) {
          console.log(`Raw error content: ${content}`);
        }
      }
    } else {
      console.error('Expected error but got success for nonexistent network');
      console.log('Raw response:', JSON.stringify(invalidResult));
    }
  } catch (error) {
    console.error('Error testing network tools:', error);
  } finally {
    // Disconnect
    await client.disconnect();
    console.log('\nTest complete');
  }
}

testNetworkTools().catch(console.error); 