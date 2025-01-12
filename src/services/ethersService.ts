import { ethers } from "ethers";
import { z } from "zod";
import { DefaultProvider, DEFAULT_PROVIDERS } from "../config/networks.js";
import { networkList, NetworkName, NetworkInfo } from "../config/networkList.js";

// Move addressSchema to class level to avoid duplication
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

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
    "Polygon zkEVM": "polygon-zkevm"
};

export class EthersService {
    private _provider: ethers.Provider;
    private _signer?: ethers.Signer;

    constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
        this._provider = provider || new ethers.JsonRpcProvider('http://localhost:8545');
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
        const alchemyApiKey = process.env.ALCHEMY_API_KEY;
        if (!alchemyApiKey) {
            throw new Error("Missing ALCHEMY_API_KEY in environment variables.");
        }
        return alchemyApiKey;
    }

    private createAlchemyProvider(network: DefaultProvider): ethers.Provider {
        try {
            return new ethers.AlchemyProvider(network as ethers.Networkish, this.getAlchemyApiKey());
        } catch (error) {
            this.handleProviderError(error, `create Alchemy provider for network ${network}`);
        }
    }

    private validateRpcUrl(url: string): void {
        if (!url.match(/^https?:\/\/.+$/)) {
            throw new Error(`Invalid RPC URL format: ${url}. URL must start with http:// or https:// and include a valid domain.`);
        }
    }

    private handleProviderError(error: unknown, context: string, details?: Record<string, any>): never {
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
        const err = error as Error;
        const errorMessage = err.message || String(error);
        const detailsStr = details ? ` Details: ${Object.entries(details).map(([k, v]) => `${k}=${this.serializeValue(v)}`).join(', ')}` : '';
        throw new Error(`Failed to ${context}: ${errorMessage}${detailsStr}`);
    }

    private serializeValue(value: any): string {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'bigint') return value.toString();
        if (Array.isArray(value)) {
            return `[${value.map(v => this.serializeValue(v)).join(', ')}]`;
        }
        if (typeof value === 'object') {
            if ('toJSON' in value && typeof value.toJSON === 'function') {
                return value.toJSON();
            }
            return JSON.stringify(value, (_, v) => 
                typeof v === 'bigint' ? v.toString() : v
            );
        }
        return String(value);
    }

    private getEthersNetworkName(network: string): string {
        return networkToEthersMap[network] || network.toLowerCase();
    }

    private getProvider(provider?: string, chainId?: number): ethers.Provider {
        if (!provider) {
            return this._provider;
        }

        // Check if it's a default provider
        if (DEFAULT_PROVIDERS.includes(provider as DefaultProvider)) {
            try {
                const networkName = this.getEthersNetworkName(provider);
                const newProvider = new ethers.AlchemyProvider(networkName, process.env.ALCHEMY_API_KEY);
                if (chainId) {
                    const providerChainId = (newProvider as any)._network?.chainId;
                    if (providerChainId && providerChainId !== chainId) {
                        console.warn(`Chain ID mismatch: specified ${chainId} but provider network is ${providerChainId}, using provider's chain ID`);
                    }
                }
                return newProvider;
            } catch (error) {
                throw this.handleProviderError(error, `create Alchemy provider for network ${provider}`);
            }
        }

        // Otherwise treat it as an RPC URL
        if (provider.startsWith("http")) {
            try {
                this.validateRpcUrl(provider);
                const newProvider = new ethers.JsonRpcProvider(provider);
                if (chainId) {
                    const providerChainId = (newProvider as any)._network?.chainId;
                    if (providerChainId && providerChainId !== chainId) {
                        console.warn(`Chain ID mismatch: specified ${chainId} but provider network is ${providerChainId}, using provider's chain ID`);
                    }
                }
                return newProvider;
            } catch (error) {
                throw this.handleProviderError(error, `create provider with RPC URL ${provider}`);
            }
        }

        throw new Error(
            `Invalid provider: ${provider}. Must be either:\n` +
            `1. A supported network name (${DEFAULT_PROVIDERS.join(", ")})\n` +
            `2. A valid RPC URL starting with http:// or https://`
        );
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

    async getERC20Balance(address: string, tokenAddress: string, provider?: string, chainId?: number): Promise<string> {
        try {
            addressSchema.parse(address);
            addressSchema.parse(tokenAddress);
            const selectedProvider = this.getProvider(provider, chainId);
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
                    console.warn("Could not derive chainId from transaction, using default provider");
                }
            }
            return await selectedProvider.getTransaction(txHash);
        } catch (error) {
            this.handleProviderError(error, "fetch transaction details", { txHash });
        }
    }

    async getGasPrice(provider?: string, chainId?: number): Promise<string> {
        try {
            const selectedProvider = this.getProvider(provider, chainId);
            const feeData = await selectedProvider.getFeeData();
            return ethers.formatUnits(feeData.gasPrice || 0n, "gwei");
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
            return DEFAULT_PROVIDERS.map((network) => {
                const networkInfo = networkList[network as NetworkName];
                return {
                    name: network,
                    chainId: networkInfo?.chainId,
                    isTestnet: network.toLowerCase().includes('testnet') || 
                              network.toLowerCase().includes('goerli') || 
                              network.toLowerCase().includes('sepolia'),
                    nativeCurrency: {
                        name: networkInfo?.currency || 'Native Token',
                        symbol: networkInfo?.currency || 'NATIVE',
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
} 