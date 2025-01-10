import { ethers } from "ethers";
import { z } from "zod";

export class EthersService {
    private provider: ethers.Provider;

    constructor() {
        const infuraApiKey = process.env.INFURA_API_KEY;
        if (!infuraApiKey) {
            throw new Error("Missing INFURA_API_KEY in environment variables.");
        }
    
        // Connect to mainnet using Infura
        this.provider = new ethers.InfuraProvider("mainnet", infuraApiKey);
    }

    async getBalance(address: string): Promise<string> {
        // Define a Zod schema to validate the address format
        const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

        try {
            // Validate the provided address
            addressSchema.parse(address);
            
            // Fetch and format the balance
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid Ethereum address format: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw new Error(`Failed to fetch balance for ${address}: ${error.message}`);
        }
    }

    async getERC20Balance(address: string, tokenAddress: string): Promise<string> {
        const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
        try {
            addressSchema.parse(address);
            addressSchema.parse(tokenAddress);
            const contract = new ethers.Contract(
                tokenAddress,
                [
                    "function balanceOf(address) view returns (uint)",
                    "function decimals() view returns (uint8)"
                ],
                this.provider
            );

            const decimals = await contract.decimals();
            const balance = await contract.balanceOf(address);
            return ethers.formatUnits(balance, decimals);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid Ethereum address format: ${error.errors.map(e => e.message).join(', ')}`);
            } else {
                throw new Error(`Failed to fetch ERC20 balance for ${address} at token address ${tokenAddress}: ${error.message}`);
            }
        }
    }
} 