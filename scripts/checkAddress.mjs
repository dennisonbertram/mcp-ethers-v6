import { ethers } from 'ethers';

async function main() {
  // This is the hardhat first account private key
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const hardhatSigner = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider('http://127.0.0.1:8545'));
  
  console.log('First Account:', await hardhatSigner.getAddress());
  console.log('Nonce:', await hardhatSigner.provider.getTransactionCount(await hardhatSigner.getAddress()));
  
  // Calculate the address where the first deployment should go
  // The contract address is determined by the sender's address and nonce (which is 0 for first deployment)
  const nonce = 0;
  const senderAddress = await hardhatSigner.getAddress();
  
  // Calculate the RLP-encoded data for contract creation
  const rlpEncodedData = ethers.concat([
    ethers.toBeArray(senderAddress), 
    ethers.toBeArray(nonce)
  ]);
  
  // Hash the RLP encoded data and take the last 20 bytes for the address
  const hashedData = ethers.keccak256(rlpEncodedData);
  const calculatedAddress = '0x' + hashedData.substring(26); // Take the last 20 bytes
  
  console.log('Expected first deployment address:', calculatedAddress);
  
  // Check if expectedAddress matches the standard address used in your tests
  const expectedAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  console.log('Tests expect address:', expectedAddress);
  console.log('Addresses match:', calculatedAddress.toLowerCase() === expectedAddress.toLowerCase());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 