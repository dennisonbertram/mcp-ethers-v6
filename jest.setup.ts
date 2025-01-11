import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default environment variables if not set
process.env.PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0123456789012345678901234567890123456789012345678901234567890123';
process.env.INFURA_API_KEY = process.env.INFURA_API_KEY || '1234567890abcdef1234567890abcdef';
process.env.PROVIDER_URL = process.env.PROVIDER_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'; 