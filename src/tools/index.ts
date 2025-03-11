import { erc20Tools, erc721Tools, erc1155Tools } from './definitions/index.js';
import { erc20Handlers, erc721Handlers, erc1155Handlers } from './handlers/index.js';

export const allTools = [
  ...erc20Tools,
  ...erc721Tools,
  ...erc1155Tools
];

export const allHandlers = {
  ...erc20Handlers,
  ...erc721Handlers,
  ...erc1155Handlers
}; 