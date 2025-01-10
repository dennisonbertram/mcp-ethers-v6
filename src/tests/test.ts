import { EthersService } from '../services/ethersService.js';
import { config } from 'dotenv';

config();

async function testGetBalance() {
    const ethersService = new EthersService();
    
    // Test cases
    const testCases = [
        // Vitalik's address
        {
            address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            shouldSucceed: true
        },
        // Invalid address
        {
            address: 'invalid-address',
            shouldSucceed: false
        },
        // Wrong format address
        {
            address: '0x123',
            shouldSucceed: false
        }
    ];

    for (const test of testCases) {
        try {
            const balance = await ethersService.getBalance(test.address);
            console.log(`✅ Balance for ${test.address}: ${balance} ETH`);
            if (!test.shouldSucceed) {
                console.error('❌ Test failed: Expected error but got success');
            }
        } catch (error: any) {
            console.error(`❌ Error for ${test.address}: ${error.message}`);
            if (test.shouldSucceed) {
                console.error('❌ Test failed: Expected success but got error');
            }
        }
    }
}

testGetBalance().catch(console.error); 