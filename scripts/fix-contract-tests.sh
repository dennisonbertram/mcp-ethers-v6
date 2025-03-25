#!/bin/bash
set -e

echo "🔄 Setting up test environment for compiled code..."

# Kill any existing Hardhat processes
echo "🛑 Stopping any running Hardhat nodes..."
pkill -f "hardhat node" || true

# Wait a moment to ensure ports are freed
sleep 2

# Start a new Hardhat node in the background
echo "🚀 Starting a fresh Hardhat node..."
npx hardhat node --hostname 127.0.0.1 --port 8545 > hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for node to start
echo "⏳ Waiting for Hardhat node to start..."
sleep 3

# Deploy the token using hardhat deploy
echo "📄 Deploying TestToken contract using Hardhat..."
npx hardhat run --network localhost scripts/deployToken.cjs

# Update the test helper - which currently looks for the TestToken contract
echo "🔄 Updating test helper with contract address..."
node scripts/updateTestHelper.mjs

# Run the compiled tests
echo "🧪 Running compiled tests..."
bun test build/src/tests/contract-methods.test.js build/src/tests/erc20-methods.test.js build/src/tests/erc721-methods.test.js build/src/tests/erc1155-methods.test.js build/src/tests/write-methods.test.js

# Clean up - kill the Hardhat node
echo "🧹 Cleaning up - stopping Hardhat node..."
kill $HARDHAT_PID || true

echo "✅ All done!" 