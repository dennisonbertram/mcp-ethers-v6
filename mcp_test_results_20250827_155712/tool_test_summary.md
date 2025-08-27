# MCP Tool Testing Results

## Summary
- **Total Tools**: 45
- **Tools Tested**: 45
- **Tools Passed**: 14
- **Tools Failed**: 31
- **Pass Rate**: 31.11%
- **Test Date**: 2025-08-27T20:00:13.778Z

## Tool Results

### ❌ getSupportedNetworks
- **Passed**: 0/0 test cases
- **Description**: Get a list of all supported networks and their configurations. For more detailed information about networks, use the getAllNetworks and getNetwork tools.



### ✅ getBlockNumber
- **Passed**: 3/3 test cases
- **Description**: No description

  ✅ Test 1: {} 
  ✅ Test 2: {"provider":"ethereum"} 
  ✅ Test 3: {"chainId":1} 

### ✅ getGasPrice
- **Passed**: 1/2 test cases
- **Description**: No description

  ✅ Test 1: {} 
  ❌ Test 2: {"provider":"polygon"} (Response timeout)

### ✅ getFeeData
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {} 
  ✅ Test 2: {"provider":"ethereum"} 

### ✅ generateWallet
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {} 
  ✅ Test 2: {"saveToEnv":false} 

### ❌ loadWallet
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool loadWallet: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "privateKey"
    ],
    "message": "Required"
  }
])

### ✅ checkWalletExists
- **Passed**: 1/1 test cases
- **Description**: No description

  ✅ Test 1: {} 

### ✅ getWalletBalance
- **Passed**: 1/1 test cases
- **Description**: No description

  ✅ Test 1: {"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"} 

### ✅ formatEther
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {"wei":"1000000000000000000"} 
  ✅ Test 2: {"wei":"500000000000000000"} 

### ✅ parseEther
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {"ether":"1.0"} 
  ✅ Test 2: {"ether":"0.5"} 

### ✅ formatUnits
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {"value":"1000000","unit":6} 
  ✅ Test 2: {"value":"1000000000","unit":"gwei"} 

### ✅ getWalletTransactionCount
- **Passed**: 1/1 test cases
- **Description**: No description

  ✅ Test 1: {"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"} 

### ✅ getBlockDetails
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {"blockTag":"latest"} 
  ✅ Test 2: {"blockTag":18000000} 

### ❌ getTransactionDetails
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getTransactionDetails: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "txHash"
    ],
    "message": "Required"
  }
])

### ❌ getContractCode
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {"address":"0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628"} (Tool returned error)

### ❌ contractCall
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool contractCall: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "abi"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "method"
    ],
    "message": "Required"
  }
])

### ❌ signMessage
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool signMessage: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "message"
    ],
    "message": "Required"
  }
])

### ❌ ethSign
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool ethSign: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "data"
    ],
    "message": "Required"
  }
])

### ✅ resolveName
- **Passed**: 2/2 test cases
- **Description**: No description

  ✅ Test 1: {"name":"vitalik.eth"} 
  ✅ Test 2: {"name":"ethereum.eth"} 

### ✅ lookupAddress
- **Passed**: 1/1 test cases
- **Description**: No description

  ✅ Test 1: {"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"} 

### ❌ sendTransaction
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool sendTransaction: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "value"
    ],
    "message": "Required"
  }
])

### ❌ sendTransactionWithOptions
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool sendTransactionWithOptions: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "value"
    ],
    "message": "Required"
  }
])

### ❌ getERC20TokenInfo
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {"contractAddress":"0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628"} (MCP error -32602: Invalid arguments for tool getERC20TokenInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  }
])

### ❌ erc20_getTokenInfo
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc20_getTokenInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  }
])

### ❌ getERC20Balance
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {"tokenAddress":"0xA0b86a33E6417c4b73f2Aa8e8e8b26bB47F8B628","userAddress":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"} (MCP error -32602: Invalid arguments for tool getERC20Balance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
])

### ❌ erc20_balanceOf
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc20_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
])

### ❌ getERC20Allowance
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getERC20Allowance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "spenderAddress"
    ],
    "message": "Required"
  }
])

### ❌ transferERC20
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool transferERC20: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "recipientAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "amount"
    ],
    "message": "Required"
  }
])

### ❌ approveERC20
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool approveERC20: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "spenderAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "amount"
    ],
    "message": "Required"
  }
])

### ❌ getNFTInfo
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getNFTInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  }
])

### ❌ getNFTOwner
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getNFTOwner: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ erc721_balanceOf
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc721_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
])

### ❌ getNFTTokenURI
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getNFTTokenURI: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ erc721_tokenURI
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc721_tokenURI: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ getNFTMetadata
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getNFTMetadata: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ transferNFT
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool transferNFT: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ approveNFT
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool approveNFT: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "approved"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
])

### ❌ setNFTApprovalForAll
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool setNFTApprovalForAll: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "operator"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "approved"
    ],
    "message": "Required"
  }
])

### ❌ erc1155_balanceOf
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc1155_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenId"
    ],
    "message": "Required"
  }
])

### ❌ erc1155_uri
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc1155_uri: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenId"
    ],
    "message": "Required"
  }
])

### ❌ erc1155_balanceOfBatch
- **Passed**: 0/1 test cases
- **Description**: No description

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool erc1155_balanceOfBatch: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": [
      "ownerAddresses"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": [
      "tokenIds"
    ],
    "message": "Required"
  }
])

### ❌ getAllNetworks
- **Passed**: 0/0 test cases
- **Description**: Get information about all available blockchain networks. Use this to identify network names, chain IDs, and RPC URLs that can be used with other Ethereum tools. When using other tools with a 'provider' parameter, you can specify any of these network names.



### ❌ getNetwork
- **Passed**: 0/2 test cases
- **Description**: Get detailed information about a specific blockchain network. This provides the network's chain ID, native token, and RPC URL that can be used with other Ethereum tools. This network name can be used as the 'provider' parameter in other tools.

  ❌ Test 1: {"networkName":"ethereum"} (MCP error -32602: Invalid arguments for tool getNetwork: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "name"
    ],
    "message": "Required"
  }
])
  ❌ Test 2: {"networkName":"polygon"} (MCP error -32602: Invalid arguments for tool getNetwork: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "name"
    ],
    "message": "Required"
  }
])

### ✅ listPrompts
- **Passed**: 1/1 test cases
- **Description**: List all available prompts in the system

  ✅ Test 1: {} 

### ❌ getEnsResolutionGuidance
- **Passed**: 0/1 test cases
- **Description**: Get guidance for resolving ENS names across networks and performing operations

  ❌ Test 1: {} (MCP error -32602: Invalid arguments for tool getEnsResolutionGuidance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ensName"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "targetNetwork"
    ],
    "message": "Required"
  },
  {
    "expected": "'balance' | 'txCount' | 'code'",
    "received": "undefined",
    "code": "invalid_type",
    "path": [
      "operation"
    ],
    "message": "Required"
  }
])


## Failed Tools Analysis

### getSupportedNetworks


### loadWallet
- Error: MCP error -32602: Invalid arguments for tool loadWallet: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "privateKey"
    ],
    "message": "Required"
  }
]

### getTransactionDetails
- Error: MCP error -32602: Invalid arguments for tool getTransactionDetails: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "txHash"
    ],
    "message": "Required"
  }
]

### getContractCode
- Error: Tool error

### contractCall
- Error: MCP error -32602: Invalid arguments for tool contractCall: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "abi"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "method"
    ],
    "message": "Required"
  }
]

### signMessage
- Error: MCP error -32602: Invalid arguments for tool signMessage: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "message"
    ],
    "message": "Required"
  }
]

### ethSign
- Error: MCP error -32602: Invalid arguments for tool ethSign: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "data"
    ],
    "message": "Required"
  }
]

### sendTransaction
- Error: MCP error -32602: Invalid arguments for tool sendTransaction: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "value"
    ],
    "message": "Required"
  }
]

### sendTransactionWithOptions
- Error: MCP error -32602: Invalid arguments for tool sendTransactionWithOptions: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "value"
    ],
    "message": "Required"
  }
]

### getERC20TokenInfo
- Error: MCP error -32602: Invalid arguments for tool getERC20TokenInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  }
]

### erc20_getTokenInfo
- Error: MCP error -32602: Invalid arguments for tool erc20_getTokenInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  }
]

### getERC20Balance
- Error: MCP error -32602: Invalid arguments for tool getERC20Balance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
]

### erc20_balanceOf
- Error: MCP error -32602: Invalid arguments for tool erc20_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
]

### getERC20Allowance
- Error: MCP error -32602: Invalid arguments for tool getERC20Allowance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "spenderAddress"
    ],
    "message": "Required"
  }
]

### transferERC20
- Error: MCP error -32602: Invalid arguments for tool transferERC20: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "recipientAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "amount"
    ],
    "message": "Required"
  }
]

### approveERC20
- Error: MCP error -32602: Invalid arguments for tool approveERC20: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "spenderAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "amount"
    ],
    "message": "Required"
  }
]

### getNFTInfo
- Error: MCP error -32602: Invalid arguments for tool getNFTInfo: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  }
]

### getNFTOwner
- Error: MCP error -32602: Invalid arguments for tool getNFTOwner: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### erc721_balanceOf
- Error: MCP error -32602: Invalid arguments for tool erc721_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  }
]

### getNFTTokenURI
- Error: MCP error -32602: Invalid arguments for tool getNFTTokenURI: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### erc721_tokenURI
- Error: MCP error -32602: Invalid arguments for tool erc721_tokenURI: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### getNFTMetadata
- Error: MCP error -32602: Invalid arguments for tool getNFTMetadata: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### transferNFT
- Error: MCP error -32602: Invalid arguments for tool transferNFT: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### approveNFT
- Error: MCP error -32602: Invalid arguments for tool approveNFT: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "approved"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_union",
    "unionErrors": [
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      },
      {
        "issues": [
          {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
              "tokenId"
            ],
            "message": "Required"
          }
        ],
        "name": "ZodError"
      }
    ],
    "path": [
      "tokenId"
    ],
    "message": "Invalid input"
  }
]

### setNFTApprovalForAll
- Error: MCP error -32602: Invalid arguments for tool setNFTApprovalForAll: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "contractAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "operator"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "approved"
    ],
    "message": "Required"
  }
]

### erc1155_balanceOf
- Error: MCP error -32602: Invalid arguments for tool erc1155_balanceOf: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ownerAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenId"
    ],
    "message": "Required"
  }
]

### erc1155_uri
- Error: MCP error -32602: Invalid arguments for tool erc1155_uri: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenId"
    ],
    "message": "Required"
  }
]

### erc1155_balanceOfBatch
- Error: MCP error -32602: Invalid arguments for tool erc1155_balanceOfBatch: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "tokenAddress"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": [
      "ownerAddresses"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": [
      "tokenIds"
    ],
    "message": "Required"
  }
]

### getAllNetworks


### getNetwork
- Error: MCP error -32602: Invalid arguments for tool getNetwork: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "name"
    ],
    "message": "Required"
  }
]
- Error: MCP error -32602: Invalid arguments for tool getNetwork: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "name"
    ],
    "message": "Required"
  }
]

### getEnsResolutionGuidance
- Error: MCP error -32602: Invalid arguments for tool getEnsResolutionGuidance: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "ensName"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "targetNetwork"
    ],
    "message": "Required"
  },
  {
    "expected": "'balance' | 'txCount' | 'code'",
    "received": "undefined",
    "code": "invalid_type",
    "path": [
      "operation"
    ],
    "message": "Required"
  }
]


## Recommendations

1. **High Priority Fixes**: Address tools that fail basic functionality tests
2. **Network Connectivity**: Many failures may be due to network/RPC issues
3. **Authentication**: Some tools may require API keys or wallet setup
4. **Parameter Validation**: Review input schema validation for failed tools
