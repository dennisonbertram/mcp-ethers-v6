# MCP Test Client Implementation Plan

## Overview

This document outlines the implementation plan for creating a comprehensive test client for the Ethers MCP server using the official `@modelcontextprotocol/sdk`. The client will allow for automated testing of the Ethers server's functionality through the MCP protocol.

## Goals

1. Create a standardized MCP client using the official SDK
2. Design reusable test utilities for different tool categories (wallet, contract, ERC standards)
3. Implement a comprehensive testing framework for the Ethers MCP server
4. Support automated test runs with clear reporting

## Implementation Steps

### 1. Create the Base MCP Client Class (src/tests/client/mcpStandardClient.ts)

- Implement a client class using the official SDK's Client interface
- Support connecting to the server via the appropriate transport
- Handle connection lifecycle and error handling
- Provide high-level methods for calling tools

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChildProcess } from "child_process";

export class McpStandardClient {
  private client: Client;
  private transport: StdioClientTransport;
  private serverProcess?: ChildProcess;

  constructor() {
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["build/src/mcpServer.js"],
    });

    this.client = new Client(
      {
        name: "mcp-ethers-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  // Connect to the server
  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  // List available tools
  async listTools(): Promise<any> {
    return await this.client.listTools();
  }

  // Call a tool
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }

  // Disconnect from the server
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
```

### 2. Create Test Suite Structure (src/tests/client/suites/*)

Organize test suites by functionality:

- **Basic Tests**: Connection, tool discovery
- **Wallet Tests**: Balance checking, transactions
- **ERC20 Tests**: Token information, balances, transfers
- **ERC721 Tests**: NFT collections, ownership, transfers
- **ERC1155 Tests**: Multi-token standard tests
- **Contract Tests**: General contract interaction

### 3. Implement Test Utilities (src/tests/client/utils/*.ts)

Create reusable utilities for common testing patterns:

```typescript
// src/tests/client/utils/testRunner.ts
export async function runTests(tests: Array<{ name: string; test: () => Promise<void> }>): Promise<{
  passed: string[];
  failed: { name: string; error: Error }[];
}> {
  const results = {
    passed: [] as string[],
    failed: [] as { name: string; error: Error }[],
  };

  for (const { name, test } of tests) {
    try {
      await test();
      results.passed.push(name);
    } catch (error) {
      results.failed.push({ name, error: error as Error });
    }
  }

  return results;
}
```

### 4. Implement Test Suites

Example test suite implementation:

```typescript
// src/tests/client/suites/walletTests.ts
import { McpStandardClient } from "../mcpStandardClient.js";
import { assert } from "../utils/assertions.js";

export async function runWalletTests(client: McpStandardClient): Promise<void> {
  // Test wallet generation
  const generateResult = await client.callTool("generateWallet", { saveToEnv: false });
  assert(generateResult.content[0].text.includes("New wallet generated"), "Wallet generation failed");

  // Test wallet balance check
  const balanceResult = await client.callTool("getWalletBalance", { 
    address: "0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8" 
  });
  assert(balanceResult.content[0].text.includes("balance"), "Balance check failed");

  // More wallet tests...
}
```

### 5. Create Master Test Runner (src/tests/runTests.ts)

Implement a master test runner that can run all test suites or specific ones:

```typescript
import { McpStandardClient } from "./client/mcpStandardClient.js";
import { runBasicTests } from "./client/suites/basicTests.js";
import { runWalletTests } from "./client/suites/walletTests.js";
import { runErc20Tests } from "./client/suites/erc20Tests.js";
import { runErc721Tests } from "./client/suites/erc721Tests.js";
import { generateReport } from "./utils/reportGenerator.js";

async function main() {
  const client = new McpStandardClient();
  
  try {
    await client.connect();
    
    // Run tests based on command line arguments
    const testSuite = process.argv[2] || "all";
    
    switch (testSuite) {
      case "basic":
        await runBasicTests(client);
        break;
      case "wallet":
        await runWalletTests(client);
        break;
      case "erc20":
        await runErc20Tests(client);
        break;
      case "erc721":
        await runErc721Tests(client);
        break;
      case "all":
        await runBasicTests(client);
        await runWalletTests(client);
        await runErc20Tests(client);
        await runErc721Tests(client);
        break;
      default:
        console.error(`Unknown test suite: ${testSuite}`);
        process.exit(1);
    }
    
    // Generate report
    await generateReport();
    
  } catch (error) {
    console.error("Test run failed:", error);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

main();
```

### 6. Create Report Generator (src/tests/utils/reportGenerator.ts)

Implement a report generator to format test results:

```typescript
export async function generateReport(results: {
  passed: string[];
  failed: { name: string; error: Error }[];
}): Promise<void> {
  console.log("\n=== TEST REPORT ===\n");
  
  console.log(`Total tests: ${results.passed.length + results.failed.length}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log("\nFailed tests:");
    results.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error.message}`);
    });
  }
}
```

## Project Structure

```
src/
  tests/
    client/
      mcpStandardClient.ts       # Main client class
      suites/
        basicTests.ts            # Basic connectivity tests
        walletTests.ts           # Wallet-related tests
        erc20Tests.ts            # ERC20 token tests
        erc721Tests.ts           # NFT tests
        erc1155Tests.ts          # Multi-token tests
        contractTests.ts         # General contract tests
      utils/
        assertions.ts            # Test assertions
        testRunner.ts            # Test running utilities
        testEnvironment.ts       # Setting up test environment
        reportGenerator.ts       # Generate test reports
    runTests.ts                  # Master test runner
```

## Implementation Timeline

1. **Day 1**: Set up project structure and implement basic client class
2. **Day 2**: Implement core test utilities and basic test suite
3. **Day 3**: Implement wallet and ERC20 test suites
4. **Day 4**: Implement ERC721 and ERC1155 test suites
5. **Day 5**: Implement contract test suite and master test runner
6. **Day 6**: Add reporting functionality and finalize documentation
7. **Day 7**: Run end-to-end tests and address any issues

## Success Criteria

- All test suites run successfully against the Ethers MCP server
- Test reports clearly indicate passing and failing tests
- The test client can be easily extended with new test suites
- Documentation provides clear instructions for running tests 