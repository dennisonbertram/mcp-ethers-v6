/**
 * @file MCP Test Client
 * @version 1.0.0
 * @status TEST
 * 
 * A simple client for testing the MCP server implementation using direct process communication
 */

import { spawn, ChildProcess } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

interface McpToolRequest {
  name: string;
  parameters: Record<string, any>;
}

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * A simple MCP client for testing our server using direct process communication
 */
export class McpTestClient {
  private serverProcess: ChildProcess;
  private requestId = 0;
  private buffer = '';
  private responseResolvers: Map<number, { resolve: (value: any) => void, reject: (reason: any) => void }> = new Map();
  
  /**
   * Creates a new MCP test client
   */
  constructor() {
    // Get the ALCHEMY_API_KEY from environment
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
    
    // Start the server process with stdio pipes and pass the environment variables
    this.serverProcess = spawn('node', ['build/src/mcpServer.js'], {
      stdio: ['pipe', 'pipe', process.stderr],
      env: {
        ...process.env,
        ALCHEMY_API_KEY
      }
    });
    
    // Set up data handling
    this.serverProcess.stdout?.on('data', (data) => this.handleServerData(data));
    
    // Handle process exit
    this.serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
    // Initialize the connection
    this.initialize();
  }
  
  /**
   * Initializes the connection with the server
   */
  private async initialize(): Promise<void> {
    try {
      // Send an initialize request
      const result = await this.makeRequest('initialize', {
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        },
        protocolVersion: '1.0.0',
        capabilities: {
          tools: {}
        }
      });
      
      console.log('Initialized connection with server:', result.serverInfo.name, result.serverInfo.version);
      
      // Send initialized notification
      await this.makeRequest('initialized', {});
    } catch (error) {
      console.error('Failed to initialize connection:', error);
    }
  }
  
  /**
   * Handles data coming from the server process
   */
  private handleServerData(data: Buffer): void {
    // Add the new data to our buffer
    this.buffer += data.toString();
    
    // Try to parse complete JSON-RPC messages
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, newlineIndex);
      this.buffer = this.buffer.substring(newlineIndex + 1);
      
      if (line.trim() === '') continue;
      
      try {
        const response: McpResponse = JSON.parse(line);
        
        // Find the resolver for this request ID
        const resolver = this.responseResolvers.get(Number(response.id));
        if (resolver) {
          this.responseResolvers.delete(Number(response.id));
          
          if (response.error) {
            resolver.reject(new Error(`${response.error.code}: ${response.error.message}`));
          } else {
            resolver.resolve(response.result);
          }
        }
      } catch (err) {
        console.error('Error parsing JSON-RPC message:', err, 'Line:', line);
      }
    }
  }
  
  /**
   * Makes a request to the MCP server
   */
  private async makeRequest(method: string, params: any): Promise<any> {
    const requestId = ++this.requestId;
    
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };
    
    return new Promise((resolve, reject) => {
      // Store the resolver
      this.responseResolvers.set(requestId, { resolve, reject });
      
      // Send the request
      this.serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }
  
  /**
   * Lists available tools from the server
   */
  async listTools(): Promise<any> {
    return this.makeRequest('tools/list', {});
  }
  
  /**
   * Calls a tool on the server
   */
  async callTool(request: McpToolRequest): Promise<any> {
    return this.makeRequest('tools/call', {
      name: request.name,
      arguments: request.parameters
    });
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

/**
 * Creates an MCP test client
 */
export async function createMcpClient() {
  const client = new McpTestClient();
  
  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    client,
    cleanup: () => {
      client.cleanup();
    }
  };
} 