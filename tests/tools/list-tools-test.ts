/**
 * @file List Tools Test
 * @version 1.0.0
 * @status TEST
 * 
 * Test script to list all available tools in the MCP server
 */

import { createMcpClient } from '../mcp-client.js';

interface ToolParameter {
  required?: boolean;
  description?: string;
}

async function testListTools() {
  console.log('Starting tool listing test...');
  
  // Create an MCP client connected to our server
  const { client, cleanup } = await createMcpClient();
  
  try {
    console.log('Listing all available tools...');
    
    // List all available tools
    const toolsResult = await client.listTools();
    
    // Print the names and descriptions of all tools
    console.log('\nAvailable Tools:');
    console.log('----------------');
    
    if (toolsResult.tools && toolsResult.tools.length > 0) {
      toolsResult.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description || 'No description'}`);
        
        // Print the parameters for each tool
        if (tool.arguments && Object.keys(tool.arguments).length > 0) {
          console.log('  Parameters:');
          Object.entries(tool.arguments).forEach(([name, param]) => {
            const typedParam = param as ToolParameter;
            const requiredText = typedParam.required ? ' (required)' : '';
            console.log(`  - ${name}${requiredText}: ${typedParam.description || 'No description'}`);
          });
        } else {
          console.log('  No parameters');
        }
        
        console.log(''); // Add a blank line between tools
      });
      
      console.log(`Total tools available: ${toolsResult.tools.length}`);
    } else {
      console.log('No tools available.');
    }
    
    console.log('\nTool listing test completed successfully!');
  } catch (error) {
    console.error('Error listing tools:', error);
    process.exit(1);
  } finally {
    // Cleanup resources
    cleanup();
  }
}

// Run the test
testListTools().catch(err => {
  console.error('Unhandled error in tool listing test:', err);
  process.exit(1);
}); 