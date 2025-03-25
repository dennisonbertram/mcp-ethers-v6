#!/bin/bash
set -e

echo "🔄 Setting up test environment..."

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

# Deploy the token contract
echo "📄 Deploying TestToken contract..."
node scripts/deployToken.mjs

# Update the test helper
echo "🔄 Updating test helper with new contract address..."
node scripts/updateTestHelper.mjs

echo "✅ Setup complete! Hardhat node is running with PID: $HARDHAT_PID"
echo "🧪 You can now run 'bun run test' to run the tests"
echo ""
echo "💡 When you're done, you can stop the Hardhat node with: kill $HARDHAT_PID" 