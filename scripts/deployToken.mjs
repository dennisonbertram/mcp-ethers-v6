import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the compiled contract ABI and bytecode
const contractPath = path.join(__dirname, '../artifacts/contracts/TestToken.sol/TestToken.json');
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

async function main() {
  console.log("Deploying TestToken...");

  // Connect to local hardhat node
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const signer = await provider.getSigner(0);
  console.log("Deploying with account:", await signer.getAddress());
  
  // Try to check if contract is already at the expected address
  const expectedAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  try {
    const code = await provider.getCode(expectedAddress);
    if (code !== '0x' && code.length > 2) {
      console.log(`Contract already deployed at: ${expectedAddress}`);
      const contract = new ethers.Contract(expectedAddress, contractJSON.abi, signer);
      
      // Get basic contract details
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      
      console.log(`Token Details:`);
      console.log(`- Name: ${name}`);
      console.log(`- Symbol: ${symbol}`);
      console.log(`- Decimals: ${decimals}`);
      console.log(`- Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
      
      return;
    }
  } catch (error) {
    console.log("No existing contract found, deploying new one...");
  }
  
  // Create a new contract factory with the contract ABI and bytecode
  const factory = new ethers.ContractFactory(
    contractJSON.abi,
    contractJSON.bytecode,
    signer
  );
  
  // Deploy the contract
  console.log("Deploying new contract...");
  const contract = await factory.deploy();
  
  // Wait for the contract deployment transaction to be mined
  await contract.deploymentTransaction().wait();
  
  const deployedAddress = await contract.getAddress();
  console.log(`TestToken deployed to: ${deployedAddress}`);
  
  // Get basic contract details
  const name = await contract.name();
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  const totalSupply = await contract.totalSupply();
  
  console.log(`Token Details:`);
  console.log(`- Name: ${name}`);
  console.log(`- Symbol: ${symbol}`);
  console.log(`- Decimals: ${decimals}`);
  console.log(`- Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 