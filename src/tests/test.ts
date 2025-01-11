import { EthersService } from '../services/ethersService.js';
import { ethers } from 'ethers';

describe('EthersService', () => {
  let ethersService: EthersService;
  const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const TEST_PROVIDER = process.env.PROVIDER_URL;
  
  beforeEach(() => {
    ethersService = new EthersService();
  });

  describe('getBalance', () => {
    it('should get balance for valid address', async () => {
      const balance = await ethersService.getBalance(VITALIK_ADDRESS, TEST_PROVIDER);
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(Number(balance)).not.toBeNaN();
    });

    it('should throw error for invalid address', async () => {
      await expect(ethersService.getBalance('invalid-address', TEST_PROVIDER))
        .rejects
        .toThrow();
    });

    it('should throw error for malformed address', async () => {
      await expect(ethersService.getBalance('0x123', TEST_PROVIDER))
        .rejects
        .toThrow();
    });
  });

  describe('getERC20Balance', () => {
    it('should get ERC20 balance for valid address and token', async () => {
      const balance = await ethersService.getERC20Balance(VITALIK_ADDRESS, USDC_CONTRACT, TEST_PROVIDER);
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(Number(balance)).not.toBeNaN();
    });

    it('should throw error for invalid address', async () => {
      await expect(ethersService.getERC20Balance('invalid-address', USDC_CONTRACT, TEST_PROVIDER))
        .rejects
        .toThrow();
    });

    it('should throw error for invalid token address', async () => {
      await expect(ethersService.getERC20Balance(VITALIK_ADDRESS, 'invalid-address', TEST_PROVIDER))
        .rejects
        .toThrow();
    });
  });

  describe('getTransactionCount', () => {
    it('should get transaction count for valid address', async () => {
      const count = await ethersService.getTransactionCount(VITALIK_ADDRESS, TEST_PROVIDER);
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should throw error for invalid address', async () => {
      await expect(ethersService.getTransactionCount('invalid-address', TEST_PROVIDER))
        .rejects
        .toThrow();
    });
  });

  describe('getBlockNumber', () => {
    it('should get current block number', async () => {
      const blockNumber = await ethersService.getBlockNumber(TEST_PROVIDER);
      expect(blockNumber).toBeDefined();
      expect(typeof blockNumber).toBe('number');
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('getBlockDetails', () => {
    it('should get block details for latest block', async () => {
      const block = await ethersService.getBlockDetails('latest', TEST_PROVIDER);
      expect(block).not.toBeNull();
      if (block) {
        expect(block.number).toBeDefined();
        expect(block.hash).toBeDefined();
        expect(block.timestamp).toBeDefined();
      }
    });

    it('should get block details for specific block number', async () => {
      const blockNumber = await ethersService.getBlockNumber(TEST_PROVIDER);
      const block = await ethersService.getBlockDetails(blockNumber - 10, TEST_PROVIDER);
      expect(block).not.toBeNull();
      if (block) {
        expect(block.number).toBe(blockNumber - 10);
        expect(block.hash).toBeDefined();
        expect(block.timestamp).toBeDefined();
      }
    });

    it('should throw error for invalid block tag', async () => {
      await expect(ethersService.getBlockDetails('invalid-block', TEST_PROVIDER))
        .rejects
        .toThrow();
    });
  });

  describe('getGasPrice', () => {
    it('should get current gas price', async () => {
      const gasPrice = await ethersService.getGasPrice(TEST_PROVIDER);
      expect(gasPrice).toBeDefined();
      expect(typeof gasPrice).toBe('string');
      // Gas price should be a valid number
      expect(Number(gasPrice)).not.toBeNaN();
      expect(Number(gasPrice)).toBeGreaterThan(0);
    });
  });

  describe('getFeeData', () => {
    it('should get current fee data', async () => {
      const feeData = await ethersService.getFeeData(TEST_PROVIDER);
      expect(feeData).toBeDefined();
      expect(feeData.gasPrice).toBeDefined();
      expect(feeData.maxFeePerGas).toBeDefined();
      expect(feeData.maxPriorityFeePerGas).toBeDefined();
    });
  });

  describe('getContractCode', () => {
    it('should get bytecode for valid contract address', async () => {
      const code = await ethersService.getContractCode(USDC_CONTRACT, TEST_PROVIDER);
      expect(code).not.toBeNull();
      if (code) {
        expect(code).not.toBe('0x');
        expect(code.startsWith('0x')).toBe(true);
      }
    });

    it('should return 0x for non-contract address', async () => {
      const code = await ethersService.getContractCode(VITALIK_ADDRESS, TEST_PROVIDER);
      expect(code).toBe('0x');
    });

    it('should throw error for invalid address', async () => {
      await expect(ethersService.getContractCode('invalid-address', TEST_PROVIDER))
        .rejects
        .toThrow();
    });
  });

  describe('formatEther and parseEther', () => {
    it('should correctly format wei to ether', () => {
      const wei = '1000000000000000000'; // 1 ETH in wei
      const ether = ethersService.formatEther(wei);
      expect(ether).toBe('1.0');
    });

    it('should correctly parse ether to wei', () => {
      const ether = '1.0';
      const wei = ethersService.parseEther(ether);
      expect(wei.toString()).toBe('1000000000000000000');
    });

    it('should throw error for invalid ether string', () => {
      expect(() => ethersService.parseEther('invalid'))
        .toThrow();
    });
  });

  describe('formatUnits and parseUnits', () => {
    it('should correctly format units', () => {
      const value = '1000000000'; // 1 GWEI
      const formatted = ethersService.formatUnits(value, 'gwei');
      expect(formatted).toBe('1.0');
    });

    it('should correctly parse units', () => {
      const value = '1.0';
      const parsed = ethersService.parseUnits(value, 'gwei');
      expect(parsed.toString()).toBe('1000000000');
    });

    it('should throw error for invalid unit string', () => {
      expect(() => ethersService.parseUnits('invalid', 'gwei'))
        .toThrow();
    });
  });
}); 