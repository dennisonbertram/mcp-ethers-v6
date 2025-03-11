/**
 * ERC Standards Helpers Examples
 * 
 * This file demonstrates how to use the ERC standard helpers in the MCP Ethers Wallet.
 */

import { EthersService } from '../src/services/ethersService';
import { ethers } from 'ethers';

// Create a provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const privateKey = process.env.PRIVATE_KEY;
const signer = privateKey ? new ethers.Wallet(privateKey, provider) : undefined;

// Create an instance of EthersService
const ethersService = new EthersService(provider, signer);

// Example addresses and token IDs
const ERC20_TOKEN_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI on Ethereum Mainnet
const ERC721_TOKEN_ADDRESS = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // BAYC on Ethereum Mainnet
const ERC1155_TOKEN_ADDRESS = '0x76BE3b62873462d2142405439777e971754E8E77'; // Parallel Alpha on Ethereum Mainnet
const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // vitalik.eth
const TOKEN_ID = '1';

async function runExamples() {
  console.log('Running ERC Standards Helpers Examples...\n');

  try {
    // ERC20 Examples
    console.log('=== ERC20 Examples ===');
    
    // Get token info
    console.log('Getting ERC20 token info...');
    const tokenInfo = await ethersService.getERC20TokenInfo(ERC20_TOKEN_ADDRESS);
    console.log('Token Info:', tokenInfo);
    
    // Get token balance
    console.log('\nGetting ERC20 balance...');
    const balance = await ethersService.getERC20Balance(ERC20_TOKEN_ADDRESS, WALLET_ADDRESS);
    console.log(`Balance of ${WALLET_ADDRESS}: ${balance} ${tokenInfo.symbol}`);

    // ERC721 Examples
    console.log('\n\n=== ERC721 Examples ===');
    
    // Get collection info
    console.log('Getting ERC721 collection info...');
    const collectionInfo = await ethersService.getERC721CollectionInfo(ERC721_TOKEN_ADDRESS);
    console.log('Collection Info:', collectionInfo);
    
    // Get token owner
    console.log('\nGetting ERC721 token owner...');
    try {
      const owner = await ethersService.getERC721Owner(ERC721_TOKEN_ADDRESS, TOKEN_ID);
      console.log(`Owner of token #${TOKEN_ID}: ${owner}`);
    } catch (error) {
      console.log(`Error getting owner: ${error.message}`);
    }
    
    // Get tokens of owner
    console.log('\nGetting ERC721 tokens of owner...');
    try {
      const tokens = await ethersService.getERC721TokensOfOwner(ERC721_TOKEN_ADDRESS, WALLET_ADDRESS, false);
      console.log(`${WALLET_ADDRESS} owns ${tokens.length} tokens from collection ${collectionInfo.name}`);
      if (tokens.length > 0) {
        console.log('First token:', tokens[0]);
      }
    } catch (error) {
      console.log(`Error getting tokens: ${error.message}`);
    }

    // ERC1155 Examples
    console.log('\n\n=== ERC1155 Examples ===');
    
    // Get token balance
    console.log('Getting ERC1155 token balance...');
    try {
      const balance = await ethersService.getERC1155Balance(ERC1155_TOKEN_ADDRESS, WALLET_ADDRESS, TOKEN_ID);
      console.log(`Balance of token #${TOKEN_ID}: ${balance}`);
    } catch (error) {
      console.log(`Error getting balance: ${error.message}`);
    }
    
    // Get tokens of owner
    console.log('\nGetting ERC1155 tokens of owner...');
    try {
      const tokens = await ethersService.getERC1155TokensOfOwner(ERC1155_TOKEN_ADDRESS, WALLET_ADDRESS);
      console.log(`${WALLET_ADDRESS} owns ${tokens.length} token types from collection`);
      if (tokens.length > 0) {
        console.log('First token:', tokens[0]);
      }
    } catch (error) {
      console.log(`Error getting tokens: ${error.message}`);
    }

    // If we have a signer, demonstrate write operations
    if (signer) {
      console.log('\n\n=== Write Operations (with signer) ===');
      
      // These operations require a signer with funds
      // Uncomment and modify as needed
      
      /*
      // Transfer ERC20 tokens
      console.log('Transferring ERC20 tokens...');
      const recipient = '0x...'; // Replace with recipient address
      const amount = '0.1'; // Amount in token units
      const tx = await ethersService.transferERC20(ERC20_TOKEN_ADDRESS, recipient, amount);
      console.log('Transaction hash:', tx.hash);
      
      // Transfer ERC721 NFT
      console.log('\nTransferring ERC721 NFT...');
      const nftRecipient = '0x...'; // Replace with recipient address
      const nftId = '123'; // Replace with your NFT ID
      const nftTx = await ethersService.transferERC721(ERC721_TOKEN_ADDRESS, nftRecipient, nftId);
      console.log('Transaction hash:', nftTx.hash);
      
      // Transfer ERC1155 tokens
      console.log('\nTransferring ERC1155 tokens...');
      const tokenRecipient = '0x...'; // Replace with recipient address
      const tokenId = '1'; // Replace with your token ID
      const tokenAmount = '1'; // Amount to transfer
      const tokenTx = await ethersService.safeTransferERC1155(
        ERC1155_TOKEN_ADDRESS, 
        await signer.getAddress(), 
        tokenRecipient, 
        tokenId, 
        tokenAmount
      );
      console.log('Transaction hash:', tokenTx.hash);
      */
    }

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples().catch(console.error); 