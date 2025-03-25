const hre = require("hardhat");

async function main() {
  console.log("Deploying TestToken...");

  // Get the signer from hardhat
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  
  // Deploy the contract
  const TestToken = await hre.ethers.getContractFactory("TestToken", deployer);
  const token = await TestToken.deploy();
  
  await token.waitForDeployment();
  
  const deployedAddress = await token.getAddress();
  console.log(`TestToken deployed to: ${deployedAddress}`);
  
  // Verify the deployment
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  
  console.log(`Token Details:`);
  console.log(`- Name: ${name}`);
  console.log(`- Symbol: ${symbol}`);
  console.log(`- Decimals: ${decimals}`);
  console.log(`- Total Supply: ${hre.ethers.formatUnits(totalSupply, decimals)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 