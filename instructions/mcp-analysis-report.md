# MCP Analysis Report for Ethers v6 Server Implementation

## Overview

This document analyzes the current Model Context Protocol (MCP) server implementation for Ethers v6 against the latest MCP TypeScript specification. The focus is on identifying areas where the implementation might need to be refactored to align with the specification, particularly related to tool registration and handling.

## Current Implementation Analysis

### Server Initialization

The current implementation uses the low-level `Server` class from the MCP SDK:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server(
  {
    name: "ethers-wallet-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

This is a valid approach for more control but differs from the high-level `McpServer` class recommended in the current specification.

### Tool Registration

Currently, tools are registered through request handlers:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...existingTools, ...allTools],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Tool handling logic
});
```

The tools themselves are defined as objects with a specific schema:

```typescript
const existingTools = [
  {
    name: "getSupportedNetworks",
    description: "Get a list of all supported networks and their configurations...",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  // More tools...
];
```

### Tool Handler Implementation

Tool handlers are implemented as functions that take arguments and return formatted responses:

```typescript
export const erc20Handlers = {
  getERC20TokenInfo: async (args: unknown) => {
    const schema = z.object({/* ... */});
    try {
      const { tokenAddress, provider, chainId } = schema.parse(args);
      // Implementation
      return {
        content: [{ type: "text", text: /* ... */ }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ /* ... */ }]
      };
    }
  },
  // More handlers...
};
```

## MCP TypeScript Specification Requirements

The current MCP TypeScript specification recommends using the high-level `McpServer` class for simplified implementation, with tools registered directly through the `tool` method:

```typescript
// Recommended pattern
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

server.tool(
  "calculate-bmi",
  {
    weightKg: z.number(),
    heightM: z.number()
  },
  async ({ weightKg, heightM }) => ({
    content: [{ type: "text", text: String(weightKg / (heightM * heightM)) }]
  })
);
```

This approach consolidates tool definition and handler implementation, simplifying maintenance and improving code readability.

## Gaps and Recommendations

1. **Server Initialization**:
   - **Current**: Using low-level `Server` class
   - **Specification**: Recommends high-level `McpServer` class
   - **Recommendation**: Consider migrating to `McpServer` for simplified implementation unless there are specific requirements for low-level control

2. **Tool Registration**:
   - **Current**: Manual registration via request handlers
   - **Specification**: Direct registration through `server.tool()` method
   - **Recommendation**: Refactor to use the simplified `server.tool()` approach, which would combine definition and implementation

3. **Schema Definition**:
   - **Current**: JSON Schema format in `inputSchema`
   - **Specification**: Zod schema objects
   - **Recommendation**: Convert JSON schemas to Zod schemas throughout the codebase

4. **Code Organization**:
   - **Current**: Separate files for tool definitions and handlers
   - **Specification**: Integrated definition and implementation
   - **Recommendation**: Consider restructuring to combine definitions and handlers, while maintaining separation of concerns through modular files

## Migration Strategy

If deciding to migrate to the recommended `McpServer` approach, consider these steps:

1. Create a new server instance using `McpServer`
2. For each tool:
   - Extract the tool name, description, and schema
   - Locate the corresponding handler implementation
   - Register using `server.tool(name, schema, handler)`
3. Update transport handling to use the new server instance
4. Implement proper error handling and response formatting

Example migration for an ERC20 tool:

```typescript
// Before
const erc20Tools = [
  {
    name: "getERC20TokenInfo",
    description: "Get basic information about an ERC20 token...",
    inputSchema: { type: "object", properties: { /* ... */ } }
  }
];

const erc20Handlers = {
  getERC20TokenInfo: async (args) => { /* ... */ }
};

// After
server.tool(
  "getERC20TokenInfo",
  {
    tokenAddress: z.string(),
    provider: z.string().optional(),
    chainId: z.number().optional()
  },
  async ({ tokenAddress, provider, chainId }) => {
    try {
      const tokenInfo = await ethersService.getERC20TokenInfo(tokenAddress, provider, chainId);
      return {
        content: [{ type: "text", text: `Token Information: ...` }]
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

## Conclusion

While the current implementation is functional, adopting the patterns recommended in the latest MCP TypeScript specification would improve maintainability, readability, and align with the intended usage pattern of the SDK. The primary change would be moving from manual request handlers to the simplified tool registration approach, and possibly adopting the high-level `McpServer` class.

The core functionality of your Ethers v6 integration can remain largely unchanged during this migration, as the main differences are in how tools are registered and structured, not in their underlying implementation. 