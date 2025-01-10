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

const DEFAULT_PROVIDERS: ReadonlyArray<DefaultProvider> = [
    "mainnet",
    "sepolia",
    "goerli",
    "arbitrum",
    "optimism",
    "base",
    "polygon"
] as const;

export class EthersService {
    private defaultProvider: ethers.Provider;

    constructor(defaultNetwork: DefaultProvider = "mainnet") {
        const infuraApiKey = process.env.INFURA_API_KEY;
        if (!infuraApiKey) {
            throw new Error("Missing INFURA_API_KEY in environment variables.");
        }
        this.defaultProvider = new ethers.InfuraProvider(defaultNetwork, infuraApiKey);
    }

    private getProvider(provider?: string): ethers.Provider {
        if (!provider) {
            return this.defaultProvider;
        }

        // Check if it's a default provider
        if (DEFAULT_PROVIDERS.includes(provider as DefaultProvider)) {
            const infuraApiKey = process.env.INFURA_API_KEY;
            if (!infuraApiKey) {
                throw new Error("Missing INFURA_API_KEY in environment variables.");
            }
            return new ethers.InfuraProvider(provider as ethers.Networkish, infuraApiKey);
        }

        // Otherwise treat it as an RPC URL
        if (provider.startsWith("http")) {
            try {
                return new ethers.JsonRpcProvider(provider);
            } catch (error: any) {
                throw new Error(`Invalid RPC URL: ${provider}. Error: ${error.message}`);
            }
        }

        throw new Error(`Invalid provider: ${provider}. Must be a supported network name (${DEFAULT_PROVIDERS.join(", ")}) or valid RPC URL.`);
    }

    async getBalance(address: string, provider?: string): Promise<string> {
        const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider);
            const balance = await selectedProvider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid Ethereum address format: ${error.errors.map(e => e.message).join(', ')}`);
            }
            if (error instanceof ethers.ProviderError) {
                throw new Error(`Provider error: ${error.message}`);
            }
            throw new Error(`Failed to fetch balance for ${address}: ${error.message}`);
        }
    }

    async getERC20Balance(address: string, tokenAddress: string, provider?: string): Promise<string> {
        const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
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
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid Ethereum address format: ${error.errors.map(e => e.message).join(', ')}`);
            }
            if (error instanceof ethers.ProviderError) {
                throw new Error(`Provider error: ${error.message}`);
            }
            if (error.code === 'CALL_EXCEPTION') {
                throw new Error(`Contract call failed. This might not be a valid ERC20 token address: ${tokenAddress}`);
            }
            throw new Error(`Failed to fetch ERC20 balance for ${address} at token address ${tokenAddress}: ${error.message}`);
        }
    }

    async getTransactionCount(address: string, provider?: string): Promise<number> {
        const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.getTransactionCount(address);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid Ethereum address format: ${error.errors.map(e => e.message).join(', ')}`);
            }
            if (error instanceof ethers.ProviderError) {
                throw new Error(`Provider error: ${error.message}`);
            }
            throw new Error(`Failed to fetch transaction count for ${address}: ${error.message}`);
        }
    }
} 