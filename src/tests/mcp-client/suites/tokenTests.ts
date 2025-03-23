/**
 * @file Token Tests
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-07-05
 * 
 * Tests for token-related MCP tools
 * 
 * IMPORTANT:
 * - Tests token standards through MCP protocol
 * - Validates token data structures
 * 
 * Functionality:
 * - Tests ERC20 token methods
 * - Tests ERC721 token methods
 * - Tests ERC1155 token methods
 */

import { McpStandardClient } from '../../client/mcpStandardClient.js';
import { assert, assertDefined, assertToolSuccess } from '../../client/utils/assertions.js';
import { logger } from '../../../utils/logger.js';

// Well-known token addresses for testing
const TEST_TOKENS = {
  // USDC (ERC20)
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  // CryptoKitties (ERC721)
  cryptoKitties: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
  // OpenSea Shared Storefront (ERC1155)
  openSeaSharedStorefront: '0x495f947276749Ce646f68AC8c248420045cb7b5e'
};

// Test accounts for token tests
const TEST_ACCOUNTS = {
  vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  binance: '0x28C6c06298d514Db089934071355E5743bf21d60'
};

/**
 * Get the list of token-related tests
 * 
 * @param client The MCP client to use for testing
 * @returns Array of test cases
 */
export function getTokenTests(client: McpStandardClient): Array<{ name: string; test: () => Promise<void> }> {
  return [
    // ERC20 Tests
    {
      name: 'ERC20 token balance',
      test: async () => {
        const result = await client.callTool('erc20_balanceOf', {
          tokenAddress: TEST_TOKENS.usdc,
          ownerAddress: TEST_ACCOUNTS.binance
        });
        assertToolSuccess(result, 'Failed to get ERC20 balance');
        
        const balanceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(balanceText, 'ERC20 balance response has no text content');
        
        // Binance should have a significant amount of USDC
        assert(
          /\d/.test(balanceText),
          `ERC20 balance response does not contain a numeric value: ${balanceText}`
        );
        
        logger.debug('ERC20 USDC balance', { balanceText });
      }
    },
    
    {
      name: 'ERC20 token information',
      test: async () => {
        const result = await client.callTool('erc20_getTokenInfo', {
          tokenAddress: TEST_TOKENS.usdc
        });
        assertToolSuccess(result, 'Failed to get ERC20 token info');
        
        const infoText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(infoText, 'ERC20 info response has no text content');
        
        // Check for essential ERC20 information
        const requiredInfo = ['name', 'symbol', 'decimals', 'total supply'];
        
        for (const info of requiredInfo) {
          assert(
            infoText.toLowerCase().includes(info),
            `ERC20 info response missing required field: ${info}`
          );
        }
        
        // USDC specific checks
        assert(
          infoText.toLowerCase().includes('usd') && 
          infoText.toUpperCase().includes('USDC'),
          `ERC20 info response does not contain expected USDC information`
        );
        
        logger.debug('ERC20 USDC info', { infoText });
      }
    },
    
    // ERC721 Tests
    {
      name: 'ERC721 balance',
      test: async () => {
        const result = await client.callTool('erc721_balanceOf', {
          tokenAddress: TEST_TOKENS.cryptoKitties,
          ownerAddress: TEST_ACCOUNTS.vitalik
        });
        assertToolSuccess(result, 'Failed to get ERC721 balance');
        
        const balanceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(balanceText, 'ERC721 balance response has no text content');
        
        // The balance should be a number
        assert(
          /\d/.test(balanceText),
          `ERC721 balance response does not contain a numeric value: ${balanceText}`
        );
        
        logger.debug('ERC721 CryptoKitties balance', { balanceText });
      }
    },
    
    {
      name: 'ERC721 token URI',
      test: async () => {
        // CryptoKitty #1 (or any other valid token ID that exists)
        const tokenId = '1';
        
        const result = await client.callTool('erc721_tokenURI', {
          tokenAddress: TEST_TOKENS.cryptoKitties,
          tokenId: tokenId
        });
        assertToolSuccess(result, 'Failed to get ERC721 token URI');
        
        const uriText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(uriText, 'ERC721 URI response has no text content');
        
        // The URI should be a URL or URI string
        assert(
          uriText.includes('http') || uriText.includes('ipfs') || uriText.includes('://'),
          `ERC721 URI response does not contain a valid URI: ${uriText}`
        );
        
        logger.debug('ERC721 CryptoKitty URI', { uriText });
      }
    },
    
    // ERC1155 Tests
    {
      name: 'ERC1155 balance',
      test: async () => {
        // OpenSea shared storefront token ID example
        // This is a sample token ID - may need to be updated with a valid one
        const tokenId = '76825723766242729905953895864693865132283439581861621487335309194786247869441';
        
        const result = await client.callTool('erc1155_balanceOf', {
          tokenAddress: TEST_TOKENS.openSeaSharedStorefront,
          ownerAddress: TEST_ACCOUNTS.vitalik,
          tokenId: tokenId
        });
        assertToolSuccess(result, 'Failed to get ERC1155 balance');
        
        const balanceText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(balanceText, 'ERC1155 balance response has no text content');
        
        // The balance should be a number
        assert(
          /\d/.test(balanceText),
          `ERC1155 balance response does not contain a numeric value: ${balanceText}`
        );
        
        logger.debug('ERC1155 token balance', { balanceText });
      }
    },
    
    {
      name: 'ERC1155 URI',
      test: async () => {
        // OpenSea shared storefront token ID example
        const tokenId = '76825723766242729905953895864693865132283439581861621487335309194786247869441';
        
        const result = await client.callTool('erc1155_uri', {
          tokenAddress: TEST_TOKENS.openSeaSharedStorefront,
          tokenId: tokenId
        });
        assertToolSuccess(result, 'Failed to get ERC1155 URI');
        
        const uriText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(uriText, 'ERC1155 URI response has no text content');
        
        // The URI should be a URL or URI string
        assert(
          uriText.includes('http') || uriText.includes('ipfs') || uriText.includes('://'),
          `ERC1155 URI response does not contain a valid URI: ${uriText}`
        );
        
        logger.debug('ERC1155 token URI', { uriText });
      }
    },
    
    {
      name: 'ERC1155 balance of batch',
      test: async () => {
        // This test is more complex and might need specific token IDs that exist
        // Using a simple test case with the same token ID repeated twice
        const tokenId = '76825723766242729905953895864693865132283439581861621487335309194786247869441';
        
        const result = await client.callTool('erc1155_balanceOfBatch', {
          tokenAddress: TEST_TOKENS.openSeaSharedStorefront,
          ownerAddresses: [TEST_ACCOUNTS.vitalik, TEST_ACCOUNTS.binance],
          tokenIds: [tokenId, tokenId]
        });
        assertToolSuccess(result, 'Failed to get ERC1155 batch balances');
        
        const batchText = result.content.find((item: any) => item.type === 'text')?.text;
        assertDefined(batchText, 'ERC1155 batch balance response has no text content');
        
        // The response should list balances
        assert(
          batchText.includes('balance') || /\d/.test(batchText),
          `ERC1155 batch balance response does not contain balance information: ${batchText}`
        );
        
        logger.debug('ERC1155 batch balance', { batchText });
      }
    }
  ];
} 