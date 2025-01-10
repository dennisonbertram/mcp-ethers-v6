import { ethers } from "ethers";
import { z } from "zod";

export type DefaultProvider = 
    | "mainnet"      // Ethereum Mainnet
    | "sepolia"      // Sepolia Testnet
    | "goerli"       // Goerli Testnet
    | "arbitrum"     // Arbitrum
    | "optimism"     // Optimism
    | "base"         // Base
    | "polygon";     // Polygon

const DEFAULT_PROVIDERS = [
    "mainnet",
    "sepolia",
    "goerli",
    "arbitrum",
    "optimism",
    "base",
    "polygon"
];

// Move addressSchema to class level to avoid duplication
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export class EthersService {
    private defaultProvider: ethers.Provider;

    constructor(defaultNetwork: DefaultProvider = "mainnet") {
        this.defaultProvider = this.createInfuraProvider(defaultNetwork);
    }

    private getInfuraApiKey(): string {
        const infuraApiKey = process.env.INFURA_API_KEY;
        if (!infuraApiKey) {
            throw new Error("Missing INFURA_API_KEY in environment variables.");
        }
        return infuraApiKey;
    }

    private createInfuraProvider(network: DefaultProvider): ethers.Provider {
        try {
            return new ethers.InfuraProvider(network as ethers.Networkish, this.getInfuraApiKey());
        } catch (error) {
            this.handleProviderError(error, `create Infura provider for network ${network}`);
        }
    }

    private validateRpcUrl(url: string): void {
        if (!url.match(/^https?:\/\/.+$/)) {
            throw new Error(`Invalid RPC URL format: ${url}. URL must start with http:// or https:// and include a valid domain.`);
        }
    }

    private handleProviderError(error: unknown, context: string, details?: Record<string, string>): never {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            const message = firstError?.message || 'Invalid input format';
            throw new Error(`Invalid input format: ${message}. Expected a valid Ethereum address (0x followed by 40 hexadecimal characters)`);
        }

        // Handle provider errors
        if (error instanceof Error && 'code' in error) {
            throw new Error(`Failed to ${context}: Provider error: ${error.message}`);
        }

        // Generic error with context
        const err = error as { message?: string };
        const errorMessage = err.message || String(error);
        const detailsStr = details ? ` Details: ${Object.entries(details).map(([k, v]) => `${k}=${v}`).join(', ')}` : '';
        throw new Error(`Failed to ${context}: ${errorMessage}${detailsStr}`);
    }

    private getProvider(provider?: string): ethers.Provider {
        if (!provider) {
            return this.defaultProvider;
        }

        // Check if it's a default provider
        if (DEFAULT_PROVIDERS.includes(provider as DefaultProvider)) {
            try {
                return this.createInfuraProvider(provider as DefaultProvider);
            } catch (error) {
                this.handleProviderError(error, `create Infura provider for network ${provider}`);
            }
        }

        // Otherwise treat it as an RPC URL
        if (provider.startsWith("http")) {
            try {
                this.validateRpcUrl(provider);
                return new ethers.JsonRpcProvider(provider);
            } catch (error) {
                this.handleProviderError(error, `create provider with RPC URL ${provider}`);
            }
        }

        throw new Error(
            `Invalid provider: ${provider}. Must be either:\n` +
            `1. A supported network name (${DEFAULT_PROVIDERS.join(", ")})\n` +
            `2. A valid RPC URL starting with http:// or https://`
        );
    }

    async getBalance(address: string, provider?: string): Promise<string> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider);
            const balance = await selectedProvider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            this.handleProviderError(error, "fetch balance", { address });
        }
    }

    async getERC20Balance(address: string, tokenAddress: string, provider?: string): Promise<string> {
        try {
            addressSchema.parse(address);
            addressSchema.parse(tokenAddress);
            const selectedProvider = this.getProvider(provider);
            const contract = new ethers.Contract(
                tokenAddress,
                [
                    "function balanceOf(address) view returns (uint)",
                    "function decimals() view returns (uint8)"
                ],
                selectedProvider
            );

            const decimals = await contract.decimals();
            const balance = await contract.balanceOf(address);
            return ethers.formatUnits(balance, decimals);
        } catch (error) {
            this.handleProviderError(error, "fetch ERC20 balance", { address, tokenAddress });
        }
    }

    async getTransactionCount(address: string, provider?: string): Promise<number> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider);
            const count = await selectedProvider.getTransactionCount(address);
            return count;
        } catch (error) {
            this.handleProviderError(error, "fetch transaction count", { address });
        }
    }

    async getBlockNumber(provider?: string): Promise<number> {
        try {
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.getBlockNumber();
        } catch (error) {
            this.handleProviderError(error, "fetch latest block number");
        }
    }

    async getBlockDetails(blockTag: string | number, provider?: string): Promise<ethers.Block | null> {
        try {
            const selectedProvider = this.getProvider(provider);
            const block = await selectedProvider.getBlock(blockTag);
            return block;
        } catch (error) {
            this.handleProviderError(error, "fetch block details", { blockTag: String(blockTag) });
        }
    }

    async getTransactionDetails(txHash: string, provider?: string): Promise<ethers.TransactionResponse | null> {
        try {
            const txSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
            txSchema.parse(txHash);
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.getTransaction(txHash);
        } catch (error) {
            this.handleProviderError(error, "fetch transaction details", { txHash });
        }
    }

    async getGasPrice(provider?: string): Promise<string> {
        try {
            const selectedProvider = this.getProvider(provider);
            const feeData = await selectedProvider.getFeeData();
            return ethers.formatUnits(feeData.gasPrice || 0n, "gwei");
        } catch (error) {
            this.handleProviderError(error, "get gas price");
        }
    }

    async getFeeData(provider?: string): Promise<ethers.FeeData> {
        try {
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.getFeeData();
        } catch (error) {
            this.handleProviderError(error, "get fee data");
        }
    }

    async getContractCode(address: string, provider?: string): Promise<string | null> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.getCode(address);
        } catch (error) {
            this.handleProviderError(error, "get contract bytecode", { address });
        }
    }
} 