import { McpStandardClient } from './build/src/tests/client/mcpStandardClient.js';

async function testPromptTools() {
  console.log('Starting Prompt Tools Test');
  
  // Create client
  const client = new McpStandardClient({
    clientName: "prompt-tools-test-client",
    clientVersion: "1.0.0",
    serverArgs: ['build/src/mcpServer.js']
  });
  
  // Connect to the MCP server
  await client.connect();
  console.log('Connected to MCP server');
  
  try {
    // List available tools to check if our prompt tools are registered
    console.log('\nListing available tools...');
    const tools = await client.listTools();
    if (tools && tools.tools) {
      const promptTools = tools.tools.filter(tool => 
        tool.name === 'listPrompts' || tool.name === 'getEnsResolutionGuidance'
      );
      
      console.log(`Found ${promptTools.length} prompt-related tools`);
      
      if (promptTools.length === 2) {
        console.log('Successfully registered both prompt tools');
      } else {
        console.warn(`Expected 2 prompt tools, found ${promptTools.length}`);
      }
    }
    
    // Test the listPrompts tool
    console.log('\nTesting listPrompts tool...');
    const promptsList = await client.callTool('listPrompts', {});
    
    if (promptsList && promptsList.content && promptsList.content.length > 0) {
      const prompts = JSON.parse(promptsList.content[0].text);
      console.log(`Found ${prompts.prompts.length} registered prompts:`);
      prompts.prompts.forEach(prompt => {
        console.log(`- ${prompt.name}: ${prompt.description}`);
        console.log(`  Arguments: ${prompt.arguments.map(arg => arg.name).join(', ')}`);
      });
      
      // If we found the ENS cross-network resolution prompt, test the guidance tool
      if (prompts.prompts.some(p => p.name === 'resolveEnsAcrossNetworks')) {
        console.log('\nTesting getEnsResolutionGuidance tool...');
        const guidance = await client.callTool('getEnsResolutionGuidance', {
          ensName: 'vitalik.eth',
          targetNetwork: 'MEGA Testnet',
          operation: 'balance'
        });
        
        if (guidance && guidance.content && guidance.content.length > 0) {
          console.log('Successfully retrieved ENS resolution guidance');
          console.log('\nGuidance preview (first 150 chars):');
          console.log(guidance.content[0].text.substring(0, 150) + '...');
        } else {
          console.error('Failed to get ENS resolution guidance');
          console.log('Raw response:', JSON.stringify(guidance));
        }
      }
    } else {
      console.error('Failed to list prompts');
      console.log('Raw response:', JSON.stringify(promptsList));
    }
  } catch (error) {
    console.error('Error testing prompt tools:', error);
  } finally {
    // Disconnect
    await client.disconnect();
    console.log('\nTest complete');
  }
}

testPromptTools().catch(console.error); 