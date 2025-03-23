import { EthersService } from './build/src/services/ethersService.js';

async function testMegaProvider() {
  const ethersService = new EthersService();
  
  try {
    console.log('Testing with provider name "MEGA Testnet"');
    const blockNumber1 = await ethersService.getBlockNumber("MEGA Testnet");
    console.log(`Block number: ${blockNumber1}`);
  } catch (error) {
    console.error('Error with provider name:', error);
  }
  
  try {
    console.log('\nTesting with provider alias "mega"');
    const blockNumber2 = await ethersService.getBlockNumber("mega");
    console.log(`Block number: ${blockNumber2}`);
  } catch (error) {
    console.error('Error with provider alias:', error);
  }
  
  try {
    console.log('\nTesting with direct RPC URL');
    const blockNumber3 = await ethersService.getBlockNumber("https://carrot.megaeth.com/rpc");
    console.log(`Block number: ${blockNumber3}`);
  } catch (error) {
    console.error('Error with RPC URL:', error);
  }
}

testMegaProvider().catch(console.error); 