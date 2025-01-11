import { ethers } from 'ethers';
import { EthersService } from '../../services/ethersService.js';

export interface TestEnvironment {
  provider: ethers.JsonRpcProvider;
  signers: ethers.Wallet[];
  ethersService: EthersService;
} 