/**
 * @file ERC Standards Constants
 * @version 1.0.0
 * @lastModified 2024-06-07
 * 
 * Standard ABIs and constants for ERC token standards
 */

// Minimal ABI for ERC20 tokens - includes only the methods we need
export const ERC20_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // State-changing functions
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Minimal ABI for ERC721 tokens
export const ERC721_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  
  // State-changing functions
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
];

// Minimal ABI for ERC1155 tokens
export const ERC1155_ABI = [
  // Read-only functions
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  
  // State-changing functions
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
  
  // Events
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  'event URI(string value, uint256 indexed id)'
];

// Interface IDs for supportsInterface checks
export const INTERFACE_IDS = {
  ERC165: '0x01ffc9a7',
  ERC721: '0x80ac58cd',
  ERC721Metadata: '0x5b5e139f',
  ERC721Enumerable: '0x780e9d63',
  ERC1155: '0xd9b67a26',
  ERC1155MetadataURI: '0x0e89341c'
};

// Standard cache keys
export const CACHE_KEYS = {
  ERC20_INFO: 'erc20:info',
  ERC20_BALANCE: 'erc20:balance',
  ERC20_ALLOWANCE: 'erc20:allowance',
  ERC721_INFO: 'erc721:info',
  ERC721_OWNER: 'erc721:owner',
  ERC721_TOKEN_URI: 'erc721:tokenUri',
  ERC721_METADATA: 'erc721:metadata',
  ERC1155_URI: 'erc1155:uri',
  ERC1155_METADATA: 'erc1155:metadata',
  ERC1155_BALANCE: 'erc1155:balance'
}; 