/**
 * @file EthersService
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-03-11
 * 
 * Service for interacting with Ethereum via ethers.js
 * 
 * IMPORTANT:
 * - Any changes must be thoroughly tested
 * - Maintain backward compatibility with existing contracts
 * 
 * Functionality:
 * - Ethereum account & network management
 * - Contract interaction
 * - Transaction processing
 * - ERC token standards support
 */

import { ethers } from "ethers";
import { z } from "zod";
import { ConfigurationError, EthersServerError, NetworkError, ProviderError, TransactionError, WalletError, handleUnknownError } from "../utils/errors.js";
import { DefaultProvider, DEFAULT_PROVIDERS } from "../config/networks.js";
import { networkList, NetworkName, NetworkInfo } from "../config/networkList.js";
import * as erc20 from "./erc/erc20.js";
import * as erc721 from "./erc/erc721.js";
import * as erc1155 from "./erc/erc1155.js";
import { ERC20Info, ERC721Info, NFTMetadata, ERC721TokenInfo, ERC1155TokenInfo, TokenOperationOptions } from "./erc/types.js";
import { TokenError } from "./erc/errors.js";
import { logger } from "../utils/logger.js";

// Move addressSchema to class level to avoid duplication
const addressSchema = z.string().refine(
    (address) => ethers.isAddress(address),
    { message: "Invalid Ethereum address format" }
);

const networkToEthersMap: Record<string, string> = {
    "Ethereum": "mainnet",
    "Polygon PoS": "matic",
    "Arbitrum": "arbitrum",
    "Arbitrum Nova": "arbitrum-nova",
    "Optimism": "optimism",
    "Avalanche C-Chain": "avalanche",
    "Base": "base",
    "BNB Smart Chain": "bnb",
    "Linea": "linea",
    "Polygon zkEVM": "polygon-zkevm",
    // New networks will use their custom RPC URLs directly, no mapping needed
    // as they don't have standard ethers.js names
};

// Add a mapping from common network names to official names
const NETWORK_ALIASES: Record<string, string> = {
    "mainnet": "Ethereum",
    "ethereum": "Ethereum",
    "eth": "Ethereum",
    "polygon": "Polygon PoS",
    "matic": "Polygon PoS",
    "bsc": "BNB Smart Chain",
    "binance": "BNB Smart Chain",
    "avalanche": "Avalanche C-Chain",
    "avax": "Avalanche C-Chain",
    "arbitrum": "Arbitrum",
    "arb": "Arbitrum",
    "optimism": "Optimism",
    "op": "Optimism",
    "base": "Base",
    "zksync": "ZKsync",
    "linea": "Linea",
    "scroll": "Scroll",
    "zkEVM": "Polygon zkEVM",
    "polygonZkEVM": "Polygon zkEVM",
    "monad": "Monad Testnet",
    "monadtestnet": "Monad Testnet",
    "mega": "MEGA Testnet",
    "megatestnet": "MEGA Testnet",
    "rari": "Rari Chain Mainnet",
    "rarichain": "Rari Chain Mainnet",
    "bera": "Berachain",
    "sonic": "Sonic Mainnet"
};

export class EthersService {
    private _provider: ethers.Provider;
    private _signer?: ethers.Signer;

    constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
        // Find a suitable default network if provider is not provided
        let defaultNetwork: DefaultProvider = DEFAULT_PROVIDERS.includes("Ethereum") ? 
            "Ethereum" : 
            DEFAULT_PROVIDERS.length > 0 ? DEFAULT_PROVIDERS[0] : "Ethereum";
            
        this._provider = provider || this.createAlchemyProvider(defaultNetwork);
        this._signer = signer;
    }

    get provider() {
        return this._provider;
    }

    setProvider(provider: ethers.Provider): void {
        this._provider = provider;
    }

    setSigner(signer: ethers.Signer): void {
        this._signer = signer;
    }

    private getAlchemyApiKey(): string {
        const apiKey = process.env.ALCHEMY_API_KEY;
        if (!apiKey) {
            throw new ConfigurationError("Alchemy API key is not set in environment variables", {
                variableName: "ALCHEMY_API_KEY"
            });
        }
        return apiKey;
    }

    private createAlchemyProvider(network: DefaultProvider): ethers.Provider {
        try {
            const apiKey = this.getAlchemyApiKey();
            
            // Map DefaultProvider names to Alchemy network names
            let alchemyNetwork: string;
            switch (network) {
                case "Ethereum":
                    alchemyNetwork = "mainnet";
                    break;
                case "Polygon PoS":
                    alchemyNetwork = "polygon";
                    break;
                case "Arbitrum":
                    alchemyNetwork = "arbitrum";
                    break;
                case "Arbitrum Nova":
                    alchemyNetwork = "arbitrum-nova";
                    break;
                case "Optimism":
                    alchemyNetwork = "optimism";
                    break;
                case "Avalanche C-Chain":
                    alchemyNetwork = "avalanche";
                    break;
                case "Base":
                    alchemyNetwork = "base";
                    break;
                default:
                    // For other networks, convert to lowercase and replace spaces with hyphens
                    alchemyNetwork = network.toLowerCase().replace(/ /g, "-");
            }
            
            try {
                // First try with standard AlchemyProvider
                return new ethers.AlchemyProvider(alchemyNetwork, apiKey);
            } catch (error) {
                logger.warn(`Failed to create Alchemy provider, falling back to default provider`, { error });
                
                // Fall back to ethers default provider
                const ethersNetwork = networkToEthersMap[network] || alchemyNetwork;
                return ethers.getDefaultProvider(ethersNetwork);
            }
        } catch (error) {
            if (error instanceof ConfigurationError) {
                logger.info("No Alchemy API key found, using default provider");
                const ethersNetwork = networkToEthersMap[network] || network.toLowerCase().replace(/ /g, "-");
                return ethers.getDefaultProvider(ethersNetwork);
            }
            throw new NetworkError(`Failed to create provider for network ${network}`, {
                network, error
            });
        }
    }

    // Check if a string has a valid RPC URL format without throwing an error
    private isValidRpcUrlFormat(url: string): boolean {
        return url.startsWith('http://') || url.startsWith('https://') || 
               url.startsWith('ws://') || url.startsWith('wss://');
    }

    // Validate that a URL has a proper RPC format and throw if not
    private validateRpcUrl(url: string): void {
        if (!this.isValidRpcUrlFormat(url)) {
            throw new NetworkError(`Invalid RPC URL format: ${url}`, {
                url
            });
        }
    }

    private handleProviderError(error: unknown, context: string, details?: Record<string, any>): never {
        if (error instanceof EthersServerError) {
            throw error;
        }

        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            
            if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
                throw new NetworkError(`Network error while trying to ${context}: ${error.message}`, {
                    ...details,
                    originalError: error
                });
            }
            
            if (errorMessage.includes('contract') || errorMessage.includes('abi')) {
                throw new ProviderError(`Contract error while trying to ${context}: ${error.message}`, {
                    ...details,
                    originalError: error
                });
            }
            
            if (errorMessage.includes('transaction') || errorMessage.includes('gas') || errorMessage.includes('fee')) {
                throw new TransactionError(`Transaction error while trying to ${context}: ${error.message}`, {
                    ...details,
                    originalError: error
                });
            }
        }
        
        // Generic error fallback
        throw new EthersServerError(
            `Error while trying to ${context}: ${error instanceof Error ? error.message : String(error)}`,
            'UNKNOWN_ERROR',
            {
                ...details,
                originalError: error
            }
        );
    }

    private serializeValue(value: any): string {
        if (value === undefined || value === null) {
            return 'null';
        }
        
        if (typeof value === 'bigint') {
            return value.toString();
        }
        
        if (Array.isArray(value)) {
            return `[${value.map(v => this.serializeValue(v)).join(', ')}]`;
        }
        
        if (typeof value === 'object') {
            // Skip internal properties of ethers
            if (value._isSigner || value._isProvider || value._isFragment) {
                return '[Object]';
            }
            
            try {
            return JSON.stringify(value, (_, v) => 
                typeof v === 'bigint' ? v.toString() : v
            );
            } catch (e) {
                return '[Object]';
        }
        }
        
        return String(value);
    }

    private getEthersNetworkName(network: string): string {
        return network in networkList ? network : 'mainnet';
    }

    private getProvider(provider?: string, chainId?: number): ethers.Provider {
        // If no provider specified, return the default provider
        if (!provider) {
            return this._provider;
        }

        let selectedProvider: ethers.Provider;
        
        // Check if the provider is an alias and convert it to the official name
        const normalizedProvider = NETWORK_ALIASES[provider.toLowerCase()] || provider;
        
        // Check if provider is a named network in our list
        if (normalizedProvider in networkList) {
            const network = normalizedProvider as NetworkName;
            const networkInfo = networkList[network];
            
            // If chainId is provided, verify it matches the network
            if (chainId !== undefined && networkInfo.chainId !== chainId) {
                throw new NetworkError(`Chain ID mismatch: requested ${chainId}, but network ${network} has chain ID ${networkInfo.chainId}`, {
                    requestedChainId: chainId,
                    networkChainId: networkInfo.chainId,
                    network
                });
            }
            
            // For Ethereum mainnet and common networks, use Alchemy
            if (DEFAULT_PROVIDERS.includes(network as DefaultProvider)) {
                try {
                    selectedProvider = this.createAlchemyProvider(network as DefaultProvider);
                } catch (error) {
                    // Fall back to custom RPC if Alchemy fails
                    // Check if this is an Alchemy URL that needs the API key appended
                    if (networkInfo.RPC.includes('alchemy.com/v2/')) {
                        try {
                            const apiKey = this.getAlchemyApiKey();
                            const rpcWithApiKey = networkInfo.RPC + apiKey;
                            this.validateRpcUrl(rpcWithApiKey);
                            selectedProvider = new ethers.JsonRpcProvider(rpcWithApiKey);
                        } catch (apiError) {
                            throw new NetworkError(`Failed to create provider for network ${network}: API key error`, {
                                network, error: apiError
                            });
                        }
                    } else {
                        this.validateRpcUrl(networkInfo.RPC);
                        selectedProvider = new ethers.JsonRpcProvider(networkInfo.RPC);
                    }
                }
            } else {
                // For other networks, use the custom RPC
                // Check if this is an Alchemy URL that needs the API key appended
                if (networkInfo.RPC.includes('alchemy.com/v2/')) {
                    try {
                        const apiKey = this.getAlchemyApiKey();
                        const rpcWithApiKey = networkInfo.RPC + apiKey;
                        this.validateRpcUrl(rpcWithApiKey);
                        selectedProvider = new ethers.JsonRpcProvider(rpcWithApiKey);
                    } catch (apiError) {
                        throw new NetworkError(`Failed to create provider for network ${network}: API key error`, {
                            network, error: apiError
                        });
                    }
                } else {
                    this.validateRpcUrl(networkInfo.RPC);
                    selectedProvider = new ethers.JsonRpcProvider(networkInfo.RPC);
                }
            }
        } else {
            // Check if the provider value looks like a valid RPC URL
            if (this.isValidRpcUrlFormat(normalizedProvider)) {
                // Assume provider is a custom RPC URL
                selectedProvider = new ethers.JsonRpcProvider(normalizedProvider);
                
                // If chainId is provided, check if it matches the network
                if (chainId !== undefined) {
                    // This will be checked when connecting to the network
                    // and throw an error if mismatched
                }
            } else {
                // Not a valid network name or URL format
                throw new NetworkError(`Invalid provider: "${provider}" is not a recognized network name or valid RPC URL`, {
                    provider
                });
            }
        }

        return selectedProvider;
    }

    async getBalance(address: string, provider?: string, chainId?: number): Promise<string> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider, chainId);
            const balance = await selectedProvider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            this.handleProviderError(error, "fetch balance", { address });
        }
    }

    // Note: This method signature is kept for backward compatibility
    // but internally delegates to the erc20 module
    async getERC20Balance(address: string, tokenAddress: string, provider?: string, chainId?: number): Promise<string> {
        try {
            addressSchema.parse(address);
            addressSchema.parse(tokenAddress);
            return await erc20.getBalance(this, tokenAddress, address, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "fetch ERC20 balance", { address, tokenAddress });
        }
    }

    async getTransactionCount(address: string, provider?: string, chainId?: number): Promise<number> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider, chainId);
            const count = await selectedProvider.getTransactionCount(address);
            return count;
        } catch (error) {
            this.handleProviderError(error, "fetch transaction count", { address });
        }
    }

    async getBlockNumber(provider?: string, chainId?: number): Promise<number> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            return await selectedProvider.getBlockNumber();
        } catch (error) {
            this.handleProviderError(error, "fetch latest block number");
        }
    }

    async getBlockDetails(blockTag: string | number, provider?: string, chainId?: number): Promise<ethers.Block | null> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            const block = await selectedProvider.getBlock(blockTag);
            return block;
        } catch (error) {
            this.handleProviderError(error, "fetch block details", { blockTag: String(blockTag) });
        }
    }

    async getTransactionDetails(txHash: string, provider?: string, chainId?: number): Promise<ethers.TransactionResponse | null> {
        try {
            const txSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
            txSchema.parse(txHash);
            let selectedProvider = this.getProvider(provider, chainId);

            if (!provider && !chainId) {
                try {
                    const derivedChainId = await this.getChainIdFromTransaction(txHash);
                    selectedProvider = this.getProvider(provider, derivedChainId);
                } catch (error) {
                    // If we can't get the chainId, continue with the default provider
                    logger.warn("Could not derive chainId from transaction, using default provider");
                }
            }
            return await selectedProvider.getTransaction(txHash);
        } catch (error) {
            this.handleProviderError(error, "fetch transaction details", { txHash });
        }
    }

    async getGasPrice(provider?: string, chainId?: number): Promise<bigint> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            const feeData = await selectedProvider.getFeeData();
            return feeData.gasPrice || 0n;
        } catch (error) {
            this.handleProviderError(error, "get gas price");
        }
    }

    async getFeeData(provider?: string, chainId?: number): Promise<ethers.FeeData> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            return await selectedProvider.getFeeData();
        } catch (error) {
            this.handleProviderError(error, "get fee data");
        }
    }

    async getContractCode(address: string, provider?: string, chainId?: number): Promise<string | null> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider, chainId);
            return await selectedProvider.getCode(address);
        } catch (error) {
            this.handleProviderError(error, "get contract bytecode", { address });
        }
    }

    async lookupAddress(address: string, provider?: string, chainId?: number): Promise<string | null> {
        try {
            addressSchema.parse(address);
            const selectedProvider = this.getProvider(provider, chainId);
            return await selectedProvider.lookupAddress(address);
        } catch (error) {
            this.handleProviderError(error, "look up ENS name for address", { address });
        }
    }

    async resolveName(name: string, provider?: string, chainId?: number): Promise<string | null> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            return await selectedProvider.resolveName(name);
        } catch (error) {
            this.handleProviderError(error, "resolve ENS name", { name });
        }
    }

    formatEther(wei: string | number | bigint): string {
        try {
            return ethers.formatEther(wei);
        } catch (error) {
            this.handleProviderError(error, "format Ether value", { wei: String(wei) });
        }
    }

    parseEther(ether: string): bigint {
        try {
            return ethers.parseEther(ether);
        } catch (error) {
            this.handleProviderError(error, "parse Ether string", { ether });
        }
    }

    formatUnits(value: string | number | bigint, unit: string | number): string {
        try {
            return ethers.formatUnits(value, unit);
        } catch (error) {
            this.handleProviderError(error, "format units", { value: String(value), unit: String(unit) });
        }
    }

    parseUnits(value: string, unit: string | number): bigint {
        try {
            return ethers.parseUnits(value, unit);
        } catch (error) {
            this.handleProviderError(error, "parse units", { value, unit: String(unit) });
        }
    }

    private getSigner(provider?: string, chainId?: number, signerOverride?: ethers.Signer): ethers.Signer {
        if (signerOverride) {
            return signerOverride;
        }

        if (this._signer) {
            return this._signer;
        }
        
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("Missing PRIVATE_KEY in environment variables. Either provide a signer in the constructor or set PRIVATE_KEY in environment variables.");
        }
        const selectedProvider = this.getProvider(provider, chainId);
        return new ethers.Wallet(privateKey, selectedProvider);
    }

    async createTransaction(to: string, value: string, data?: string, provider?: string): Promise<ethers.TransactionRequest> {
        try {
            addressSchema.parse(to);
            const parsedValue = ethers.parseEther(value);

            const transaction: ethers.TransactionRequest = {
                to,
                value: parsedValue,
                data: data || "0x",
            };
            
            const signer = this.getSigner(provider);
            const populatedTx = await signer.populateTransaction(transaction);
            return populatedTx;
        } catch (error) {
            this.handleProviderError(error, "create transaction", { to, value });
        }
    }

    async estimateGas(tx: ethers.TransactionRequest, provider?: string): Promise<bigint> {
        try {
            const signer = this.getSigner(provider);
            const result = await signer.estimateGas(tx);
            return result;
        } catch (error) {
            this.handleProviderError(error, "estimate gas", { tx: JSON.stringify(tx) });
        }
    }

    async sendTransaction(
        toOrTx: string | ethers.TransactionRequest,
        value?: string,
        data?: string,
        provider?: string
    ): Promise<ethers.TransactionResponse> {
        try {
            let tx: ethers.TransactionRequest;
            
            if (typeof toOrTx === 'string') {
                // Handle old-style parameter based call
                addressSchema.parse(toOrTx);
                tx = {
                    to: toOrTx,
                    value: value ? ethers.parseEther(value) : undefined,
                    data: data || "0x"
                };
            } else {
                // Handle object-style call
                if (toOrTx.to) {
                    addressSchema.parse(toOrTx.to);
                }
                tx = toOrTx;
            }

            const signer = this.getSigner(provider);
            return await signer.sendTransaction(tx);
        } catch (error) {
            this.handleProviderError(error, "send transaction", { tx: toOrTx });
        }
    }

    async signMessage(message: string, provider?: string): Promise<string> {
        try {
            const signer = this.getSigner(provider);
            return await signer.signMessage(message);
        } catch (error) {
            this.handleProviderError(error, "sign message", { message });
        }
    }

    /**
     * Signs data using the Ethereum eth_sign method (legacy)
     * Note: This method is less secure than signMessage (personal_sign) as it can sign transaction-like data
     * 
     * @param data The data to sign (as a hex string)
     * @param provider Optional provider name or URL
     * @returns The signature as a hexadecimal string
     */
    async ethSign(data: string, provider?: string): Promise<string> {
        try {
            // Ensure data is properly formatted as hex
            if (!data.startsWith('0x')) {
                data = '0x' + Buffer.from(data).toString('hex');
            }
            
            const signer = this.getSigner(provider);
            
            // In ethers v6, we can use signMessage for both personal_sign and eth_sign
            // The difference is in how the message is formatted
            
            // For eth_sign, we use the raw data without the Ethereum prefix
            // This is a lower-level operation and should be used with caution
            
            // Convert hex to bytes
            const dataBytes = ethers.getBytes(data);
            
            // Sign the raw bytes
            // Note: This is equivalent to eth_sign in most cases
            const signature = await signer.signMessage(dataBytes);
            
            return signature;
        } catch (error) {
            this.handleProviderError(error, "eth_sign", { data });
        }
    }

    async contractCall(
        contractAddress: string,
        abi: string | Array<string>,
        method: string,
        args: any[] = [],
        provider?: string,
        chainId?: number
    ): Promise<any> {
        try {
            addressSchema.parse(contractAddress);
            const selectedProvider = this.getProvider(provider, chainId);
            
            // Parse ABI if it's a string
            let parsedAbi: any = abi;
            if (typeof abi === 'string') {
                try {
                    parsedAbi = JSON.parse(abi);
                } catch (e) {
                    throw new Error(`Invalid ABI: ${abi}. The ABI must be a valid JSON string or array of strings`);
                }
            }
            
            // Create contract instance with provider
            const contract = new ethers.Contract(
                contractAddress,
                parsedAbi,
                selectedProvider
            );

            // Get function fragment to check if it's view/pure
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }

            // For view/pure functions, use provider directly
            if (fragment.constant || fragment.stateMutability === 'view' || fragment.stateMutability === 'pure') {
                const result = await contract.getFunction(method).staticCall(...args);
                return this.serializeEventArgs(result); // Use our serializer for the result
            }

            throw new Error(`Use contractSendTransaction for state-changing function: ${method}`);
        
        } catch (error) {
            this.handleProviderError(error, `call contract method: ${method}`, {
                contractAddress,
                abi: typeof abi === 'string' ? abi : JSON.stringify(abi),
                args: this.serializeValue(args),
            });
        }
    }

    async contractCallView(
        contractAddress: string,
        abi: string | Array<string>,
        method: string,
        args: any[] = [],
        provider?: string,
        chainId?: number
    ): Promise<any> {
        try {
            addressSchema.parse(contractAddress);
            const selectedProvider = this.getProvider(provider, chainId);
            
            // Parse ABI if it's a string
            let parsedAbi: any = abi;
            if (typeof abi === 'string') {
                try {
                    parsedAbi = JSON.parse(abi);
                } catch (e) {
                    throw new Error(`Invalid ABI: ${abi}. The ABI must be a valid JSON string or array of strings`);
                }
            }
            
            // Create contract instance with provider
            const contract = new ethers.Contract(
                contractAddress,
                parsedAbi,
                selectedProvider
            );

            // Get function fragment to check if it's view/pure
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }

            // For view/pure functions, use provider directly
            if (!fragment.constant && fragment.stateMutability !== 'view' && fragment.stateMutability !== 'pure') {
                throw new Error(`Use contractSendTransaction for state-changing function: ${method}`);
            }

            const result = await contract.getFunction(method).staticCall(...args);
            return this.serializeEventArgs(result); // Use our serializer for the result
        } catch (error) {
            this.handleProviderError(error, `call contract view method: ${method}`, {
                contractAddress,
                abi: typeof abi === 'string' ? abi : JSON.stringify(abi),
                args: this.serializeValue(args),
            });
        }
    }

    async contractCallWithEstimate(
        contractAddress: string,
        abi: string,
        method: string,
        args: any[] = [],
        value: string = "0",
        provider?: string
    ): Promise<any> {
        try {
            addressSchema.parse(contractAddress);
            const signer = this.getSigner(provider);
            const contract = new ethers.Contract(
                contractAddress,
                abi,
                signer
            );
            const parsedValue = ethers.parseEther(value);
            
            // Get the function fragment for the method
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }
            
            // Encode the function data
            const data = contract.interface.encodeFunctionData(fragment, args);
            
            // Create the transaction request
            const tx = {
                to: contractAddress,
                data,
                value: parsedValue
            };
            
            // Estimate the gas
            const estimatedGas = await signer.estimateGas(tx);
            
            // Add the estimated gas and send the transaction
            return await this.contractSendTransaction(
                contractAddress,
                abi,
                method,
                args,
                value,
                provider,
                { gasLimit: estimatedGas }
            );
        } catch (error) {
            this.handleProviderError(error, `call contract method with estimate: ${method}`, {
                contractAddress,
                abi: JSON.stringify(abi),
                args: JSON.stringify(args),
                value
            });
        }
    }

    async contractCallWithOverrides(
        contractAddress: string,
        abi: string,
        method: string,
        args: any[] = [],
        value: string = "0",
        provider?: string,
        overrides?: ethers.Overrides
    ): Promise<any> {
        try {
            addressSchema.parse(contractAddress);
            const signer = this.getSigner(provider);
            const contract = new ethers.Contract(
                contractAddress,
                abi,
                signer
            );
            const parsedValue = ethers.parseEther(value);
            
            // Get the function fragment for the method
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }
            
            // Merge value with other overrides
            const txOverrides = {
                ...overrides,
                value: parsedValue
            };
            
            // Call the contract method with overrides
            const tx = await contract[method](...args, txOverrides);
            return tx;
        } catch (error) {
            this.handleProviderError(error, `call contract method with overrides: ${method}`, {
                contractAddress,
                abi: JSON.stringify(abi),
                args: this.serializeValue(args),
                value,
                overrides: this.serializeValue(overrides)
            });
        }
    }

    async contractSendTransaction(
        contractAddress: string,
        abi: string,
        method: string,
        args: any[] = [],
        value: string = "0",
        provider?: string,
        overrides?: ethers.Overrides
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(contractAddress);
            const signer = this.getSigner(provider);
            const contract = new ethers.Contract(
                contractAddress,
                abi,
                signer
            );
            const parsedValue = ethers.parseEther(value);
            
            // Get the function fragment for the method
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }
            
            // Encode the function data
            const data = contract.interface.encodeFunctionData(fragment, args);
            
            // Create the transaction request with overrides
            const tx = {
                to: contractAddress,
                data,
                value: parsedValue,
                ...overrides
            };
            
            // Send the transaction
            return await signer.sendTransaction(tx);
        } catch (error) {
            this.handleProviderError(error, `send transaction to contract method: ${method}`, {
                contractAddress,
                abi: JSON.stringify(abi),
                args: JSON.stringify(args),
                value
            });
        }
    }

    async contractSendTransactionWithEstimate(
        contractAddress: string,
        abi: string,
        method: string,
        args: any[],
        value: string = "0",
        provider?: string
    ): Promise<ethers.TransactionResponse> {
        try {
            const parsedAddress = addressSchema.parse(contractAddress);
            const contract = new ethers.Contract(parsedAddress, abi, await this.getSigner(provider));
            const parsedValue = ethers.parseEther(value);

            // Get the function fragment for the method
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }
            
            // Encode the function data with value
            const data = contract.interface.encodeFunctionData(fragment, args);
            const tx = {
                to: parsedAddress,
                data,
                value: parsedValue
            };

            // Estimate gas
            const gasEstimate = await contract.getFunction(method).estimateGas(...args, { value: parsedValue });
            
            // Send transaction with estimated gas
            return await contract.getFunction(method)(...args, {
                value: parsedValue,
                gasLimit: gasEstimate
            });
        } catch (error) {
            throw this.handleProviderError(error, `send transaction to contract method with estimate: ${method}`, {
                contractAddress,
                abi: JSON.stringify(abi),
                args: JSON.stringify(args),
                value
            });
        }
    }

    async contractSendTransactionWithOverrides(
        contractAddress: string,
        abi: string,
        method: string,
        args: any[],
        value: string = "0",
        provider?: string,
        overrides: ethers.Overrides = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            const parsedAddress = addressSchema.parse(contractAddress);
            const contract = new ethers.Contract(parsedAddress, abi, await this.getSigner(provider));
            const parsedValue = ethers.parseEther(value);

            // Get the function fragment for the method
            const fragment = contract.interface.getFunction(method);
            if (!fragment) {
                throw new Error(`Method ${method} not found in contract ABI`);
            }
            
            // Merge value with other overrides
            const txOverrides = {
                ...overrides,
                value: parsedValue
            };

            // Encode the function data
            const data = contract.interface.encodeFunctionData(fragment, args);
            
            // Send transaction with overrides
            return await contract.getFunction(method)(...args, txOverrides);
        } catch (error) {
            throw this.handleProviderError(error, `send transaction to contract method with overrides: ${method}`, {
                contractAddress,
                abi: JSON.stringify(abi),
                args: this.serializeValue(args),
                value,
                overrides: this.serializeValue(overrides)
            });
        }
    }

    async sendRawTransaction(
        signedTransaction: string,
        provider?: string
    ): Promise<ethers.TransactionResponse> {
        try {
            const selectedProvider = this.getProvider(provider);
            return await selectedProvider.broadcastTransaction(signedTransaction);
        } catch (error) {
            this.handleProviderError(error, "send raw transaction", { signedTransaction });
        }
    }

    private formatEvent(log: ethers.EventLog | ethers.Log): any {
        const formattedEvent = {
            address: log.address,
            blockNumber: log.blockNumber?.toString(),
            transactionHash: log.transactionHash,
            logIndex: log.index,
            name: 'eventName' in log ? log.eventName : undefined,
            args: 'args' in log ? this.serializeEventArgs(log.args) : undefined,
            data: log.data,
            topics: log.topics
        };
        return formattedEvent;
    }

    private serializeEventArgs(args: any): any {
        if (args === null || args === undefined) return args;
        if (typeof args === 'bigint') return args.toString();
        if (Array.isArray(args)) {
            return args.map(arg => this.serializeEventArgs(arg));
        }
        if (typeof args === 'object') {
            const serialized: any = {};
            for (const [key, value] of Object.entries(args)) {
                if (key === 'length' && Array.isArray(args)) continue;
                if (key === '_isBigNumber' || key === 'type' || key === 'hash') continue; // Skip internal ethers properties
                serialized[key] = this.serializeEventArgs(value);
            }
            return serialized;
        }
        return args;
    }

    async queryLogs(
        address?: string,
        topics?: Array<string | null | Array<string>>,
        fromBlock?: string | number,
        toBlock?: string | number,
        provider?: string,
        chainId?: number
    ): Promise<any> {
        try {
            let checksummedAddress: string | undefined;
            if (address) {
                checksummedAddress = ethers.getAddress(address);
            }
            const selectedProvider = this.getProvider(provider, chainId);
            const filter: ethers.Filter = {
                address: checksummedAddress,
                topics: topics
            };

            const logs = await selectedProvider.getLogs({
                ...filter,
                fromBlock: fromBlock,
                toBlock: toBlock
            });

            return logs.map((log) => this.formatEvent(log));
        } catch (error) {
            this.handleProviderError(error, "query logs", {
                address: address || "any",
                topics: topics ? JSON.stringify(topics) : "any",
                fromBlock: String(fromBlock || "any"),
                toBlock: String(toBlock || "any")
            });
        }
    }

    async contractEvents(
        contractAddress: string,
        abi: string | Array<string>,
        eventName?: string,
        topics?: Array<string | null | Array<string>>,
        fromBlock?: string | number,
        toBlock?: string | number,
        provider?: string,
        chainId?: number
    ): Promise<any> {
        try {
            // Use queryLogs under the hood as it's more reliable
            const checksummedAddress = ethers.getAddress(contractAddress);
            const selectedProvider = this.getProvider(provider, chainId);
            const contract = new ethers.Contract(checksummedAddress, abi, selectedProvider);

            // If no event name specified, get all events
            if (!eventName) {
                return this.queryLogs(
                    checksummedAddress,
                    topics,
                    fromBlock,
                    toBlock,
                    provider,
                    chainId
                );
            }

            // Get the event fragment to encode topics
            const fragment = contract.interface.getEvent(eventName);
            if (!fragment) {
                throw new Error(`Event ${eventName} not found in contract ABI`);
            }

            // Get the topic hash for this event
            const topicHash = fragment.topicHash;
            const eventTopics: (string | null | Array<string>)[] = [topicHash];
            if (topics && topics.length > 0) {
                eventTopics.push(...topics);
            }

            // Use queryLogs with the event-specific topic
            const logs = await this.queryLogs(
                checksummedAddress,
                eventTopics,
                fromBlock,
                toBlock,
                provider,
                chainId
            );

            // Parse the logs with the contract interface
            return logs.map((log: ethers.Log) => {
                try {
                    const parsedLog = contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    return {
                        ...log,
                        name: parsedLog?.name,
                        args: this.serializeEventArgs(parsedLog?.args)
                    };
                } catch (e) {
                    // If parsing fails, return the raw log
                    return log;
                }
            });
        } catch (error) {
            this.handleProviderError(error, "query contract events", {
                contractAddress,
                abi: typeof abi === 'string' ? abi : JSON.stringify(abi),
                eventName: eventName || "any",
                topics: topics ? this.serializeValue(topics) : "any",
                fromBlock: String(fromBlock || "any"),
                toBlock: String(toBlock || "any")
            });
        }
    }

    async sendTransactionWithOptions(
        toOrTx: string | ethers.TransactionRequest,
        value?: string,
        data?: string,
        gasLimit?: string,
        gasPrice?: string,
        nonce?: number,
        provider?: string,
        chainId?: number,
        signerOverride?: ethers.Signer
    ): Promise<ethers.TransactionResponse> {
        try {
            let tx: ethers.TransactionRequest;
            
            if (typeof toOrTx === 'string') {
                addressSchema.parse(toOrTx);
                tx = {
                    to: toOrTx,
                    value: value ? ethers.parseEther(value) : undefined,
                    data: data || "0x",
                    gasLimit: gasLimit ? ethers.getBigInt(gasLimit) : undefined,
                    gasPrice: gasPrice ? ethers.parseUnits(gasPrice, "gwei") : undefined,
                    nonce,
                };
            } else {
                if(toOrTx.to) {
                    addressSchema.parse(toOrTx.to);
                }
                tx = {
                    ...toOrTx,
                    gasLimit: gasLimit ? ethers.getBigInt(gasLimit) : undefined,
                    gasPrice: gasPrice ? ethers.parseUnits(gasPrice, "gwei") : undefined,
                    nonce,
                }
            }

            const signer = this.getSigner(provider, chainId, signerOverride);
            return await signer.sendTransaction(tx);
        } catch (error) {
            this.handleProviderError(error, "send transaction with options", {
                tx: toOrTx, value, data, gasLimit, gasPrice, nonce
            });
        }
    }

    getSupportedNetworks(): Array<{
        name: string;
        chainId?: number;
        isTestnet?: boolean;
        nativeCurrency?: {
            name: string;
            symbol: string;
            decimals: number;
        };
        isDefault?: boolean;
    }> {
        try {
            const defaultNetwork = process.env.DEFAULT_NETWORK || "mainnet";
            // Filter out networks that don't have a corresponding entry in networkList or don't have a chainId
            return DEFAULT_PROVIDERS
                .filter((network) => {
                    const networkInfo = networkList[network as NetworkName];
                    return networkInfo && typeof networkInfo.chainId === 'number';
                })
                .map((network) => {
                    const networkInfo = networkList[network as NetworkName];
                    return {
                        name: network,
                        chainId: networkInfo.chainId,
                        isTestnet: network.toLowerCase().includes('testnet') || 
                                network.toLowerCase().includes('goerli') || 
                                network.toLowerCase().includes('sepolia'),
                        nativeCurrency: {
                            name: networkInfo.currency || 'Native Token',
                            symbol: networkInfo.currency || 'NATIVE',
                            decimals: 18
                        },
                        isDefault: network === defaultNetwork
                    };
                });
        } catch (error) {
            throw this.handleProviderError(error, "get supported networks");
        }
    }


    async getWalletInfo(provider?: string): Promise<{ address: string } | null> {
        try {
            if (!this._signer) {
                return null;
            }
            
            const selectedProvider = provider ? this.getProvider(provider) : this._provider;
            const signer = this._signer.connect(selectedProvider);
            const address = await signer.getAddress();
            
            return { address };
        } catch (error) {
            this.handleProviderError(error, "get wallet info");
        }
    }

    /**
     * Get the current wallet signer
     * 
     * @param provider Optional provider to connect the signer to
     * @returns The ethers wallet signer or null if no wallet is set
     */
    async getWallet(provider?: string): Promise<ethers.Signer | null> {
        try {
            if (!this._signer) {
                return null;
            }
            
            const selectedProvider = provider ? this.getProvider(provider) : this._provider;
            return this._signer.connect(selectedProvider);
        } catch (error) {
            this.handleProviderError(error, "get wallet");
        }
    }

    async getChainIdFromTransaction(txHash: string, provider?: string): Promise<number> {
        try {
            const txSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
            txSchema.parse(txHash);
            const selectedProvider = this.getProvider(provider);
            const tx = await selectedProvider.getTransaction(txHash);
            if (!tx) {
                throw new Error("Transaction not found");
            }
            
            return Number(tx.chainId);
        } catch (error) {
            this.handleProviderError(error, "fetch transaction details", { txHash });
        }
    }

    async getTransactionsByBlock(blockTag: string | number, provider?: string, chainId?: number): Promise<ethers.TransactionResponse[]> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            const block = await selectedProvider.getBlock(blockTag, true);
            if (!block || !block.transactions) {
                return [];
            }
            const transactionRequests = await Promise.all(block.transactions.map(tx => selectedProvider.getTransaction(tx)));
            return transactionRequests.filter((tx): tx is ethers.TransactionResponse => tx != null);
        } catch (error) {
            this.handleProviderError(error, "get transactions by block", { blockTag: String(blockTag) });
        }
    }

    // ERC20 Token Methods

    /**
     * Get basic information about an ERC20 token
     * 
     * @param tokenAddress Token contract address
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with token information
     */
    async getERC20TokenInfo(
        tokenAddress: string,
        provider?: string,
        chainId?: number
    ): Promise<ERC20Info> {
        try {
            addressSchema.parse(tokenAddress);
            return await erc20.getTokenInfo(this, tokenAddress, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC20 token info", { tokenAddress });
        }
    }

    /**
     * Get the allowance amount approved for a spender
     * 
     * @param tokenAddress ERC20 token contract address
     * @param ownerAddress Token owner address
     * @param spenderAddress Spender address
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with formatted allowance as string
     */
    async getERC20Allowance(
        tokenAddress: string,
        ownerAddress: string,
        spenderAddress: string,
        provider?: string,
        chainId?: number
    ): Promise<string> {
        try {
            addressSchema.parse(tokenAddress);
            addressSchema.parse(ownerAddress);
            addressSchema.parse(spenderAddress);
            return await erc20.getAllowance(this, tokenAddress, ownerAddress, spenderAddress, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC20 allowance", { tokenAddress, ownerAddress, spenderAddress });
        }
    }

    /**
     * Transfer ERC20 tokens to a recipient
     * 
     * @param tokenAddress ERC20 token contract address
     * @param recipientAddress Recipient address
     * @param amount Amount to transfer in token units (e.g., "1.5" not wei)
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async transferERC20(
        tokenAddress: string,
        recipientAddress: string,
        amount: string,
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(tokenAddress);
            addressSchema.parse(recipientAddress);
            return await erc20.transfer(this, tokenAddress, recipientAddress, amount, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "transfer ERC20 tokens", { tokenAddress, recipientAddress, amount });
        }
    }

    /**
     * Approve a spender to use ERC20 tokens
     * 
     * @param tokenAddress ERC20 token contract address
     * @param spenderAddress Spender address to approve
     * @param amount Amount to approve in token units (e.g., "1.5" not wei)
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async approveERC20(
        tokenAddress: string,
        spenderAddress: string,
        amount: string,
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(tokenAddress);
            addressSchema.parse(spenderAddress);
            return await erc20.approve(this, tokenAddress, spenderAddress, amount, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "approve ERC20 tokens", { tokenAddress, spenderAddress, amount });
        }
    }

    /**
     * Transfer ERC20 tokens from one address to another (requires approval)
     * 
     * @param tokenAddress ERC20 token contract address
     * @param senderAddress Address to transfer from
     * @param recipientAddress Recipient address
     * @param amount Amount to transfer in token units (e.g., "1.5" not wei)
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async transferFromERC20(
        tokenAddress: string,
        senderAddress: string,
        recipientAddress: string,
        amount: string,
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(tokenAddress);
            addressSchema.parse(senderAddress);
            addressSchema.parse(recipientAddress);
            return await erc20.transferFrom(this, tokenAddress, senderAddress, recipientAddress, amount, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "transfer ERC20 tokens from sender", { tokenAddress, senderAddress, recipientAddress, amount });
        }
    }

    // ERC721 NFT Methods

    /**
     * Get basic information about an ERC721 NFT collection
     * 
     * @param contractAddress NFT contract address
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with NFT collection information
     */
    async getERC721CollectionInfo(
        contractAddress: string,
        provider?: string,
        chainId?: number
    ): Promise<ERC721Info> {
        try {
            addressSchema.parse(contractAddress);
            return await erc721.getNFTInfo(this, contractAddress, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC721 collection info", { contractAddress });
        }
    }

    /**
     * Get the owner of a specific NFT
     * 
     * @param contractAddress NFT contract address
     * @param tokenId Token ID to check ownership
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with owner address
     */
    async getERC721Owner(
        contractAddress: string,
        tokenId: string | number,
        provider?: string,
        chainId?: number
    ): Promise<string> {
        try {
            addressSchema.parse(contractAddress);
            return await erc721.ownerOf(this, contractAddress, tokenId, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC721 owner", { contractAddress, tokenId });
        }
    }

    /**
     * Get and parse metadata for a specific NFT
     * 
     * @param contractAddress NFT contract address
     * @param tokenId Token ID
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with parsed metadata
     */
    async getERC721Metadata(
        contractAddress: string,
        tokenId: string | number,
        provider?: string,
        chainId?: number
    ): Promise<NFTMetadata> {
        try {
            addressSchema.parse(contractAddress);
            return await erc721.getMetadata(this, contractAddress, tokenId, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC721 metadata", { contractAddress, tokenId });
        }
    }

    /**
     * Get all NFTs owned by an address
     * 
     * @param contractAddress NFT contract address
     * @param ownerAddress Owner address to check
     * @param includeMetadata Whether to include metadata
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with array of owned NFTs
     */
    async getERC721TokensOfOwner(
        contractAddress: string,
        ownerAddress: string,
        includeMetadata: boolean = false,
        provider?: string,
        chainId?: number
    ): Promise<ERC721TokenInfo[]> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(ownerAddress);
            return await erc721.getUserNFTs(this, contractAddress, ownerAddress, includeMetadata, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC721 tokens of owner", { contractAddress, ownerAddress });
        }
    }

    /**
     * Transfer an NFT to a new owner
     * 
     * @param contractAddress NFT contract address
     * @param toAddress Recipient address
     * @param tokenId Token ID to transfer
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async transferERC721(
        contractAddress: string,
        toAddress: string,
        tokenId: string | number,
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(toAddress);
            return await erc721.transferNFT(this, contractAddress, toAddress, tokenId, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "transfer ERC721 NFT", { contractAddress, toAddress, tokenId });
        }
    }

    /**
     * Safely transfer an NFT to a new owner
     * 
     * @param contractAddress NFT contract address
     * @param toAddress Recipient address
     * @param tokenId Token ID to transfer
     * @param data Optional data to include
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async safeTransferERC721(
        contractAddress: string,
        toAddress: string,
        tokenId: string | number,
        data: string = '0x',
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(toAddress);
            return await erc721.safeTransferNFT(this, contractAddress, toAddress, tokenId, data, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "safe transfer ERC721 NFT", { contractAddress, toAddress, tokenId });
        }
    }

    // ERC1155 Multi-Token Methods

    /**
     * Get token balance for a specific ERC1155 token ID
     * 
     * @param contractAddress ERC1155 contract address
     * @param ownerAddress Owner address to check
     * @param tokenId Token ID to check balance
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with token balance as string
     */
    async getERC1155Balance(
        contractAddress: string,
        ownerAddress: string,
        tokenId: string | number,
        provider?: string,
        chainId?: number
    ): Promise<string> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(ownerAddress);
            return await erc1155.balanceOf(this, contractAddress, ownerAddress, tokenId, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC1155 balance", { contractAddress, ownerAddress, tokenId });
        }
    }

    /**
     * Get token balances for multiple ERC1155 token IDs at once
     * 
     * @param contractAddress ERC1155 contract address
     * @param ownerAddresses Array of owner addresses
     * @param tokenIds Array of token IDs
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with array of token balances
     */
    async getERC1155BatchBalances(
        contractAddress: string,
        ownerAddresses: string[],
        tokenIds: (string | number)[],
        provider?: string,
        chainId?: number
    ): Promise<string[]> {
        try {
            addressSchema.parse(contractAddress);
            ownerAddresses.forEach(address => addressSchema.parse(address));
            return await erc1155.balanceOfBatch(this, contractAddress, ownerAddresses, tokenIds, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC1155 batch balances", { contractAddress, ownerAddresses, tokenIds });
        }
    }

    /**
     * Get and parse metadata for a specific ERC1155 token
     * 
     * @param contractAddress ERC1155 contract address
     * @param tokenId Token ID to get metadata for
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with token metadata
     */
    async getERC1155Metadata(
        contractAddress: string,
        tokenId: string | number,
        provider?: string,
        chainId?: number
    ): Promise<NFTMetadata> {
        try {
            addressSchema.parse(contractAddress);
            return await erc1155.getMetadata(this, contractAddress, tokenId, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC1155 metadata", { contractAddress, tokenId });
        }
    }

    /**
     * Get all ERC1155 tokens owned by an address
     * 
     * @param contractAddress ERC1155 contract address
     * @param ownerAddress Owner address to check
     * @param tokenIds Optional array of specific token IDs to check
     * @param includeMetadata Whether to include metadata
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @returns Promise with array of token info
     */
    async getERC1155TokensOfOwner(
        contractAddress: string,
        ownerAddress: string,
        tokenIds?: (string | number)[],
        includeMetadata: boolean = false,
        provider?: string,
        chainId?: number
    ): Promise<ERC1155TokenInfo[]> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(ownerAddress);
            return await erc1155.getUserTokens(this, contractAddress, ownerAddress, tokenIds, includeMetadata, provider, chainId);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "get ERC1155 tokens of owner", { contractAddress, ownerAddress });
        }
    }

    /**
     * Safely transfer ERC1155 tokens to another address
     * 
     * @param contractAddress ERC1155 contract address
     * @param fromAddress Sender address
     * @param toAddress Recipient address
     * @param tokenId Token ID to transfer
     * @param amount Amount to transfer
     * @param data Additional data to include with the transfer
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async safeTransferERC1155(
        contractAddress: string,
        fromAddress: string,
        toAddress: string,
        tokenId: string | number,
        amount: string,
        data: string = '0x',
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(fromAddress);
            addressSchema.parse(toAddress);
            return await erc1155.safeTransferFrom(this, contractAddress, fromAddress, toAddress, tokenId, amount, data, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "safe transfer ERC1155 tokens", { contractAddress, fromAddress, toAddress, tokenId, amount });
        }
    }

    /**
     * Safely transfer multiple ERC1155 tokens in a batch
     * 
     * @param contractAddress ERC1155 contract address
     * @param fromAddress Sender address
     * @param toAddress Recipient address
     * @param tokenIds Array of token IDs to transfer
     * @param amounts Array of amounts to transfer
     * @param data Additional data to include with the transfer
     * @param provider Optional provider name or instance
     * @param chainId Optional chain ID
     * @param options Optional transaction options
     * @returns Promise with transaction response
     */
    async safeBatchTransferERC1155(
        contractAddress: string,
        fromAddress: string,
        toAddress: string,
        tokenIds: (string | number)[],
        amounts: string[],
        data: string = '0x',
        provider?: string,
        chainId?: number,
        options: TokenOperationOptions = {}
    ): Promise<ethers.TransactionResponse> {
        try {
            addressSchema.parse(contractAddress);
            addressSchema.parse(fromAddress);
            addressSchema.parse(toAddress);
            return await erc1155.safeBatchTransferFrom(this, contractAddress, fromAddress, toAddress, tokenIds, amounts, data, provider, chainId, options);
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            this.handleProviderError(error, "safe batch transfer ERC1155 tokens", { contractAddress, fromAddress, toAddress, tokenIds, amounts });
        }
    }

    /**
     * Get wallet balance in ETH
     * 
     * @param address Address to check balance for
     * @param provider Optional provider or network name
     * @param chainId Optional chain ID
     * @returns Formatted balance string in ETH
     */
    async getWalletBalance(address: string, provider?: string, chainId?: number): Promise<string> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            const balance = await selectedProvider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            this.handleProviderError(error, "get wallet balance", { address });
        }
    }
} 