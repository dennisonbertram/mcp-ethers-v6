# Ethers v6 MCP Server Refactoring Plan

## Overview

This document outlines a structured plan to refactor the current Ethers v6 MCP server implementation to align with the latest MCP TypeScript specification. The primary goals are to:

1. Migrate from the low-level `Server` class to the higher-level `McpServer` class
2. Adopt the direct tool registration pattern using `server.tool()`
3. Convert JSON schema definitions to Zod schemas
4. Maintain separation of concerns while improving code organization

## Phase 1: Setup and Preparation

### 1.1. Environment Preparation

- [ ] Create a new feature branch from the current implementation
- [ ] Ensure all dependencies are up-to-date, particularly `@modelcontextprotocol/sdk`
- [ ] Set up a test environment to validate functionality during the refactoring process

### 1.2. Code Analysis and Mapping

- [ ] Document all existing tools, their schemas, and handler implementations
- [ ] Create a mapping between tool definitions and handlers
- [ ] Identify any complex functionality that might require special handling
- [ ] Document current server initialization and transport setup

## Phase 2: Core Server Migration

### 2.1. Server Initialization Refactoring

- [ ] Create a new file (e.g., `mcpServer.ts`) to implement the new server
- [ ] Initialize the server using the `McpServer` class:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "ethers-wallet-server",
  version: "1.0.0"
});

// Transport setup
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2.2. Service Integration

- [ ] Ensure the Ethers service is properly initialized and accessible
- [ ] Set up network providers and any other dependent services
- [ ] Verify service functionality with basic tests

## Phase 3: Tool Migration

### 3.1. Tool Structure and Organization

- [ ] Create a new directory structure for the refactored tools
- [ ] For each category of tools (ERC20, ERC721, etc.), create a dedicated module
- [ ] Design a pattern for combining schema definition and implementation

### 3.2. Schema Conversion

- [ ] Convert JSON Schema definitions to Zod schemas
- [ ] Implement comprehensive validation with helpful error messages
- [ ] Create utility functions for common schema patterns

### 3.3. Tool Registration

- [ ] Start with a small subset of tools to establish the pattern
- [ ] For each tool, implement using the new pattern:

```typescript
// Generic pattern
server.tool(
  "toolName",
  {
    // Zod schema for parameters
    param1: z.string(),
    param2: z.number().optional()
  },
  async ({ param1, param2 }) => {
    try {
      // Implementation
      return {
        content: [{ type: "text", text: "Result" }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${error.message}` }]
      };
    }
  }
);
```

- [ ] Gradually migrate all tools using a consistent pattern
- [ ] Implement proper error handling in each tool

## Phase 4: Modular Implementation

To maintain separation of concerns while adhering to the new pattern, we'll create a hybrid approach where tools are defined in separate modules but registered using the recommended pattern.

### 4.1. Create Module Structure

For each tool category (e.g., ERC20, ERC721), create a module export pattern:

```typescript
// src/tools/erc20.ts
import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerERC20Tools(server: McpServer, ethersService: any) {
  // Register all ERC20 tools
  server.tool(
    "getERC20TokenInfo",
    {
      tokenAddress: z.string(),
      provider: z.string().optional(),
      chainId: z.number().optional()
    },
    async ({ tokenAddress, provider, chainId }) => {
      // Implementation
    }
  );
  
  // Additional tools...
}
```

### 4.2. Common Patterns and Utilities

- [ ] Create utility functions for common operations
- [ ] Implement shared error handling patterns
- [ ] Create a consistent response formatting approach

### 4.3. Tool Registration in Main Server

- [ ] Import and register all tool modules in the main server file:

```typescript
import { registerERC20Tools } from './tools/erc20.js';
import { registerERC721Tools } from './tools/erc721.js';
// More imports...

// Register all tool categories
registerERC20Tools(server, ethersService);
registerERC721Tools(server, ethersService);
// More registrations...
```

## Phase 5: Testing and Validation

### 5.1. Unit Testing

- [ ] Create unit tests for each tool and category
- [ ] Test with various input types and edge cases
- [ ] Verify error handling and response formatting

### 5.2. Integration Testing

- [ ] Test the full server with the MCP Inspector
- [ ] Verify all tools are properly registered and functional
- [ ] Compare output with the original implementation to ensure consistency

### 5.3. Documentation

- [ ] Update comments and documentation to reflect the new implementation
- [ ] Create examples of tool usage for reference

## Phase 6: Deployment and Finalization

### 6.1. Performance and Optimization

- [ ] Profile the server for performance issues
- [ ] Optimize as needed for production use
- [ ] Ensure proper memory management and resource cleanup

### 6.2. Final Cleanup

- [ ] Remove deprecated code and files
- [ ] Ensure code consistency and style
- [ ] Run final linting and type checking

### 6.3. Release and Documentation

- [ ] Prepare release notes
- [ ] Update README and other documentation
- [ ] Create migration guide for users of the previous implementation

## Timeline and Priorities

### Critical Path

1. Server initialization refactoring (Phase 2.1)
2. Core tool migration (Phase 3)
3. Testing and validation (Phase 5)

### Recommended Implementation Order

1. Start with the server initialization and a single tool category
2. Add remaining tool categories one by one
3. Complete testing and validation for each category before moving to the next
4. Perform final optimization and cleanup

## Conclusion

This refactoring plan provides a structured approach to migrating the current Ethers v6 MCP server implementation to align with the latest MCP TypeScript specification. By following this plan, we can maintain the existing functionality while improving code organization, readability, and maintainability.

The modular approach recommended here allows for separation of concerns while still adhering to the recommended patterns in the MCP specification. This balance ensures the codebase remains well-organized and maintainable as it grows. 