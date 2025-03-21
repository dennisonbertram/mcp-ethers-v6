/**
 * @file MCP Test Client
 * @version 1.0.0
 * @status TEST
 * 
 * A simple client for testing the MCP server implementation
 */

import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

interface McpToolRequest {
  name: string;
  arguments: Record<string, any>;
}

interface McpResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * A simple MCP client for testing our server
 */
export class McpTestClient {
  private serverProcess: ChildProcess;
  private requestId = 0;
  private port: number;
  
  /**
   * Creates a new MCP test client
   * @param port The port to use for the server (default: 3000)
   */
  constructor(port = 3000) {
    this.port = port;
    
    // Start the server process (configured to use HTTP)
    this.serverProcess = spawn('node', ['build/src/mcpServer.js', '--port', `${this.port}`], {
      stdio: 'inherit'
    });
    
    // Give the server a moment to start
    this.waitForServerStart();
  }
  
  /**
   * Waits for the server to start
   */
  private async waitForServerStart(): Promise<void> {
    return new Promise(resolve => {
      // Wait a bit for the server to start up
      setTimeout(resolve, 1000);
    });
  }
  
  /**
   * Makes a request to the MCP server
   * @param method The JSONRPC method to call
   * @param params The parameters to send
   */
  private async makeRequest(method: string, params: any): Promise<any> {
    const requestId = ++this.requestId;
    
    const requestData = JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    });
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response: McpResponse = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(`${response.error.code}: ${response.error.message}`));
            } else {
              resolve(response.result);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.write(requestData);
      req.end();
    });
  }
  
  /**
   * List all available tools
   */
  async listTools(): Promise<{ tools: Array<{ name: string, description: string, arguments: any }> }> {
    return this.makeRequest('mcp.listTools', {});
  }
  
  /**
   * Call a tool
   * @param request The tool request with name and arguments
   */
  async callTool(request: McpToolRequest): Promise<any> {
    return this.makeRequest('mcp.callTool', request);
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