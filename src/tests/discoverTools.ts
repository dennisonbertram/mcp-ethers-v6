#!/usr/bin/env node

/**
 * @file MCP Tool Discovery
 * @version 1.0.0
 * @lastModified 2024-06-28
 * 
 * Simple script to discover available tools on the MCP server
 */

import { McpStandardClient } from './client/mcpStandardClient.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function main(): Promise<void> {
  // Initialize client
  const client = new McpStandardClient({
    serverCommand: 'node',
    serverArgs: ['build/src/index.js'],
    clientName: 'mcp-tool-discovery',
    clientVersion: '1.0.0'
  });
  
  try {
    // Connect to server
    console.log('Connecting to MCP server...');
    await client.connect();
    
    // List available tools
    console.log('Listing available tools...');
    const result = await client.listTools();
    
    if (result && result.tools && Array.isArray(result.tools)) {
      console.log(`\nFound ${result.tools.length} tools:\n`);
      
      // Print tools sorted alphabetically
      const sortedTools = [...result.tools].sort((a, b) => a.name.localeCompare(b.name));
      
      sortedTools.forEach((tool) => {
        console.log(`- ${tool.name}`);
        if (tool.description) {
          console.log(`  ${tool.description}`);
        }
        if (tool.arguments && Array.isArray(tool.arguments)) {
          console.log(`  Arguments: ${tool.arguments.map((arg: any) => arg.name).join(', ')}`);
        }
        console.log();
      });
    } else {
      console.log('No tools found or invalid response format');
    }
  } catch (error) {
    console.error('Error discovering tools:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

main().catch(console.error); 