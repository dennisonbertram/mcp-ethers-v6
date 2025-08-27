# MCP Server Test Plan

## Test Results Summary
- **Timestamp**: 2025-08-27T19:58:59.096Z
- **Server Status**: Connected
- **Protocol Version**: 2024-11-05

## Server Information
- **Name**: Ethers Wallet
- **Version**: 1.0.0

## Discovered Capabilities

### Tools (45)
1. **getSupportedNetworks**: Get a list of all supported networks and their configurations. For more detailed information about networks, use the getAllNetworks and getNetwork tools.
   - Input Schema: Available
2. **getBlockNumber**: No description
   - Input Schema: Available
3. **getGasPrice**: No description
   - Input Schema: Available
4. **getFeeData**: No description
   - Input Schema: Available
5. **generateWallet**: No description
   - Input Schema: Available
6. **loadWallet**: No description
   - Input Schema: Available
7. **checkWalletExists**: No description
   - Input Schema: Available
8. **getWalletBalance**: No description
   - Input Schema: Available
9. **formatEther**: No description
   - Input Schema: Available
10. **parseEther**: No description
   - Input Schema: Available
11. **formatUnits**: No description
   - Input Schema: Available
12. **getWalletTransactionCount**: No description
   - Input Schema: Available
13. **getBlockDetails**: No description
   - Input Schema: Available
14. **getTransactionDetails**: No description
   - Input Schema: Available
15. **getContractCode**: No description
   - Input Schema: Available
16. **contractCall**: No description
   - Input Schema: Available
17. **signMessage**: No description
   - Input Schema: Available
18. **ethSign**: No description
   - Input Schema: Available
19. **resolveName**: No description
   - Input Schema: Available
20. **lookupAddress**: No description
   - Input Schema: Available
21. **sendTransaction**: No description
   - Input Schema: Available
22. **sendTransactionWithOptions**: No description
   - Input Schema: Available
23. **getERC20TokenInfo**: No description
   - Input Schema: Available
24. **erc20_getTokenInfo**: No description
   - Input Schema: Available
25. **getERC20Balance**: No description
   - Input Schema: Available
26. **erc20_balanceOf**: No description
   - Input Schema: Available
27. **getERC20Allowance**: No description
   - Input Schema: Available
28. **transferERC20**: No description
   - Input Schema: Available
29. **approveERC20**: No description
   - Input Schema: Available
30. **getNFTInfo**: No description
   - Input Schema: Available
31. **getNFTOwner**: No description
   - Input Schema: Available
32. **erc721_balanceOf**: No description
   - Input Schema: Available
33. **getNFTTokenURI**: No description
   - Input Schema: Available
34. **erc721_tokenURI**: No description
   - Input Schema: Available
35. **getNFTMetadata**: No description
   - Input Schema: Available
36. **transferNFT**: No description
   - Input Schema: Available
37. **approveNFT**: No description
   - Input Schema: Available
38. **setNFTApprovalForAll**: No description
   - Input Schema: Available
39. **erc1155_balanceOf**: No description
   - Input Schema: Available
40. **erc1155_uri**: No description
   - Input Schema: Available
41. **erc1155_balanceOfBatch**: No description
   - Input Schema: Available
42. **getAllNetworks**: Get information about all available blockchain networks. Use this to identify network names, chain IDs, and RPC URLs that can be used with other Ethereum tools. When using other tools with a 'provider' parameter, you can specify any of these network names.
   - Input Schema: Available
43. **getNetwork**: Get detailed information about a specific blockchain network. This provides the network's chain ID, native token, and RPC URL that can be used with other Ethereum tools. This network name can be used as the 'provider' parameter in other tools.
   - Input Schema: Available
44. **listPrompts**: List all available prompts in the system
   - Input Schema: Available
45. **getEnsResolutionGuidance**: Get guidance for resolving ENS names across networks and performing operations
   - Input Schema: Available

### Prompts (1)
1. **resolveEnsAcrossNetworks**: A prompt that guides resolving ENS names on Ethereum mainnet and performing operations with the resolved address on other networks.

### Resources (0)
No resources discovered

## Test Strategy

### Phase 1: Core Tool Testing
- **getSupportedNetworks**: Basic network operation test
- **getBlockNumber**: Basic network operation test
- **getGasPrice**: Basic network operation test
- **getFeeData**: Basic network operation test

### Phase 2: Wallet Tool Testing
- **generateWallet**: Wallet management test
- **loadWallet**: Wallet management test
- **checkWalletExists**: Wallet management test
- **getWalletBalance**: Wallet management test

### Phase 3: Utility Tool Testing
- **formatEther**: Utility function test
- **parseEther**: Utility function test
- **formatUnits**: Utility function test

### Phase 4: Contract Tool Testing
- **getContractCode**: Contract interaction test
- **contractCall**: Contract interaction test

### Phase 5: ERC Token Testing
- **getERC20TokenInfo**: Token standard test
- **erc20_getTokenInfo**: Token standard test
- **getERC20Balance**: Token standard test
- **erc20_balanceOf**: Token standard test
- **getERC20Allowance**: Token standard test
- **transferERC20**: Token standard test
- **approveERC20**: Token standard test
- **erc721_balanceOf**: Token standard test
- **erc721_tokenURI**: Token standard test
- **erc1155_balanceOf**: Token standard test
- **erc1155_uri**: Token standard test
- **erc1155_balanceOfBatch**: Token standard test

## Error Analysis
No errors encountered during discovery.

## Next Steps
1. Test each tool individually with valid parameters
2. Test error handling with invalid parameters
3. Test API integrations (Ethereum network calls)
4. Performance and reliability testing
5. End-to-end workflow testing
