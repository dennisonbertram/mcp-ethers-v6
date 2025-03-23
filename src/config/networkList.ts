export type NetworkInfo = {
  currency: string;
  chainId: number;
  RPC: string;
  explorer: string;
}

export type NetworkName = keyof typeof networkList;

export const networkList = {
  "Ethereum": {
    "currency": "ETH",
    "chainId": 1,
    "RPC": "https://eth-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Polygon PoS": {
    "currency": "POL",
    "chainId": 137,
    "RPC": "https://polygon-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Arbitrum": {
    "currency": "ETH",
    "chainId": 42161,
    "RPC": "https://arb-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Arbitrum Nova": {
    "currency": "ETH",
    "chainId": 42170,
    "RPC": "https://arbnova-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Optimism": {
    "currency": "ETH",
    "chainId": 10,
    "RPC": "https://opt-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Avalanche C-Chain": {
    "currency": "AVAX",
    "chainId": 43114,
    "RPC": "https://avalanche-c-chain-rpc.publicnode.com",
    "explorer": ""
  },
  "Base": {
    "currency": "ETH",
    "chainId": 8453,
    "RPC": "https://base-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Polygon zkEVM": {
    "currency": "ETH",
    "chainId": 1101,
    "RPC": "https://polygonzkevm-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Linea": {
    "currency": "ETH",
    "chainId": 59144,
    "RPC": "https://linea-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "BNB Smart Chain": {
    "currency": "BNB",
    "chainId": 56,
    "RPC": "https://bnb-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Scroll": {
    "currency": "ETH",
    "chainId": 534352,
    "RPC": "https://scroll-mainnet.g.alchemy.com/v2/",
    "explorer": ""
  },
  "Monad Testnet": {
    "currency": "MON",
    "chainId": 10143,
    "RPC": "https://testnet-rpc.monad.xyz",
    "explorer": ""
  },
  "MEGA Testnet": {
    "currency": "ETH",
    "chainId": 6342,
    "RPC": "https://carrot.megaeth.com/rpc",
    "explorer": ""
  },
  "Rari Chain Mainnet": {
    "currency": "ETH",
    "chainId": 1380012617,
    "RPC": "https://mainnet.rpc.rarichain.org/http",
    "explorer": ""
  },
  "Berachain": {
    "currency": "BERA",
    "chainId": 80094,
    "RPC": "https://rpc.berachain.com",
    "explorer": ""
  },
  "Sonic Mainnet": {
    "currency": "S",
    "chainId": 146,
    "RPC": "https://rpc.soniclabs.com",
    "explorer": ""
  },
  "Gnosis": {
    "currency": "xDAI",
    "chainId": 100,
    "RPC": "https://rpc.gnosischain.com",
    "explorer": ""
  },
  "CrossFi": {
    "currency": "XFI",
    "chainId": 4157,
    "RPC": "https://rpc.crossfi.org",
    "explorer": ""
  },
  "Lens": {
    "currency": "LENS",
    "chainId": 13337,
    "RPC": "https://rpc.lens.xyz",
    "explorer": ""
  },
  "World Chain": {
    "currency": "WORLD",
    "chainId": 59144001,
    "RPC": "https://rpc.worldchain.xyz",
    "explorer": ""
  }
} as const;
