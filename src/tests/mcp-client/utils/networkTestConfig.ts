/**
 * @file Network Test Configuration
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-09
 * 
 * Configuration for network testing with expected values and test data
 * 
 * IMPORTANT:
 * - Add test networks with appropriate configuration
 * - Use public test networks when possible
 * - Ensure test addresses have minimal funds
 * 
 * Functionality:
 * - Defines test networks for cross-network testing
 * - Provides expected values for validation
 * - Configures test data for each network
 */

/**
 * Interface for network test configuration
 */
export interface NetworkTestConfig {
  /** RPC name or alias for this network */
  rpcName: string;
  /** Expected chain ID for validation */
  chainId: number;
  /** Expected native currency symbol */
  expectedCurrency: string;
  /** Test address with some balance on this network (optional) */
  testAddress?: string;
  /** Expected block time range in seconds [min, max] */
  expectedBlockTimeRange?: [number, number];
  /** Whether this network requires an API key */
  requiresApiKey?: boolean;
  /** Whether this is a testnet (affects acceptable test behavior) */
  isTestnet?: boolean;
  /** Additional test data for this network */
  testData?: {
    /** Test contract address on this network (if applicable) */
    contractAddress?: string;
    /** Token address for testing (if applicable) */
    tokenAddress?: string;
    /** Expected token symbol (if tokenAddress is provided) */
    expectedTokenSymbol?: string;
  };
}

/**
 * Test network configurations
 * These networks will be used for cross-network testing
 */
export const TEST_NETWORKS: Record<string, NetworkTestConfig> = {
  // Ethereum Sepolia Testnet
  "Ethereum": {
    rpcName: "sepolia",
    chainId: 11155111,
    expectedCurrency: "ETH",
    testAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Use a common known address
    expectedBlockTimeRange: [1, 15], // Sepolia block time varies
    requiresApiKey: true,
    isTestnet: true,
    testData: {
      // Using USDC contract on Sepolia testnet
      contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      expectedTokenSymbol: "USDC"
    }
  },
  
  // Polygon Mumbai Testnet
  "Polygon PoS": {
    rpcName: "mumbai",
    chainId: 80001, // Mumbai testnet (instead of mainnet 137)
    expectedCurrency: "POL",
    testAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    expectedBlockTimeRange: [1, 5],
    requiresApiKey: true,
    isTestnet: true,
    testData: {
      contractAddress: "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747", // USDC on Mumbai
      expectedTokenSymbol: "USDC"
    }
  },

  // Monad Testnet
  "Monad Testnet": {
    rpcName: "monad",
    chainId: 10143,
    expectedCurrency: "MON",
    testAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    expectedBlockTimeRange: [1, 5],
    requiresApiKey: false,
    isTestnet: true
  },

  // MEGA Testnet
  "MEGA Testnet": {
    rpcName: "mega",
    chainId: 6342,
    expectedCurrency: "ETH",
    expectedBlockTimeRange: [1, 10],
    requiresApiKey: false,
    isTestnet: true
  },

  // Linea Goerli Testnet
  "Linea": {
    rpcName: "linea-goerli",
    chainId: 59140, // Linea Goerli testnet
    expectedCurrency: "ETH",
    expectedBlockTimeRange: [1, 10],
    requiresApiKey: false,
    isTestnet: true
  },

  // Optimism Goerli Testnet (using public endpoint)
  "Optimism": {
    rpcName: "optimism-goerli",
    chainId: 420, // Optimism Goerli testnet
    expectedCurrency: "ETH",
    expectedBlockTimeRange: [1, 5],
    requiresApiKey: false,
    isTestnet: true
  },

  // Base Goerli Testnet
  "Base": {
    rpcName: "base-goerli",
    chainId: 84531, // Base Goerli testnet
    expectedCurrency: "ETH",
    expectedBlockTimeRange: [1, 5],
    requiresApiKey: false,
    isTestnet: true
  }
};

/**
 * Minimal set of networks that should be tested
 * These are considered core networks for basic functionality validation
 */
export const CORE_TEST_NETWORKS = ["Ethereum", "Polygon PoS", "Monad Testnet"];

/**
 * Get network by its RPC name or alias
 */
export function getNetworkByRpcName(rpcName: string): [string, NetworkTestConfig] | undefined {
  const entry = Object.entries(TEST_NETWORKS).find(
    ([_, config]) => config.rpcName.toLowerCase() === rpcName.toLowerCase()
  );
  return entry;
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): [string, NetworkTestConfig] | undefined {
  const entry = Object.entries(TEST_NETWORKS).find(
    ([_, config]) => config.chainId === chainId
  );
  return entry;
} 