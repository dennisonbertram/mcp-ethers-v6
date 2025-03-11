import { z } from 'zod';
import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv();

// Define configuration schema
const configSchema = z.object({
  ALCHEMY_API_KEY: z.string().optional(),
  PRIVATE_KEY: z.string().optional(),
  DEFAULT_NETWORK: z.string().default('mainnet'),
  SERVER_PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate configuration
export type Config = z.infer<typeof configSchema>;

// Attempt to parse environment variables
const result = configSchema.safeParse(process.env);

// Handle validation errors
if (!result.success) {
  console.error('Invalid configuration:', result.error.format());
  process.exit(1);
}

// Export the validated config
export const config: Config = result.data;

// Utility function to check if a wallet is configured
export function isWalletConfigured(): boolean {
  return Boolean(config.PRIVATE_KEY);
}

// Utility function to get configuration status
export function getConfigStatus(): Record<string, boolean> {
  return {
    hasAlchemyKey: Boolean(config.ALCHEMY_API_KEY),
    hasWallet: isWalletConfigured(),
    // Add other configuration status as needed
  };
} 