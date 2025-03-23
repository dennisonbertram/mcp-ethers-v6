/**
 * SimpleERC1155 Contract Definition
 * Compiled from SimpleERC1155.sol
 */

export const SimpleERC1155Contract = {
  abi: [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name_",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "uri_",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256[]",
				"name": "ids",
				"type": "uint256[]"
			},
			{
				"indexed": false,
				"internalType": "uint256[]",
				"name": "values",
				"type": "uint256[]"
			}
		],
		"name": "TransferBatch",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "TransferSingle",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "value",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "URI",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "accounts",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "ids",
				"type": "uint256[]"
			}
		],
		"name": "balanceOfBatch",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "mint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256[]",
				"name": "ids",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "amounts",
				"type": "uint256[]"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "mintBatch",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256[]",
				"name": "ids",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "amounts",
				"type": "uint256[]"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeBatchTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "tokenURI",
				"type": "string"
			}
		],
		"name": "setTokenURI",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "uri",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
],
  bytecode: "608060405234801561000f575f5ffd5b506040516109ea3803806109ea833981810160405281019061002f9190610149565b815f908161003c919061031a565b5080600190816100499190610405565b50505061049a565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100ac8261006a565b810181811067ffffffffffffffff821117156100cb576100ca61007a565b5b80604052505050565b5f6100dc61004f565b90506100e88282610173565b919050565b5f80fd5b5f67ffffffffffffffff82111561010b5761010a61007a565b5b6101148261006a565b9050602081019050919050565b82818337505f83111582906101335750600061013f565b600183015f1983169150505b505050565b5f615f8284031215610146576101456101ee565b5b5f825190505f615f601f85168301840111156101645761016361028a565b5b610172846101f1565b9150506101c2565b6101978261006a565b810181811067ffffffffffffffff821117156101b6576101b561007a565b5b80604052505050565b5f80fd5b5f80fd5b5f80fd5b5f615f601f19601f84011682036020815260448301840184895f831115610214576102136101ee565b5b83019050602081015f8311158290610230575060006101c2565b600183015f198316905082850361024757505061027e565b5f5b8381101561026c578085016020810160018601018501610249565b5f1b81019050828501610272565b50505050506101c2565b61027e8261006a565b810181811067ffffffffffffffff8211171561029d5761029c61007a565b5b80604052505050565b5f81519050919050565b5f82825260208201905092915050565b5f5b838110156102df5780820151818401526020810190506102c4565b5f8484015250505050565b5f6102f4826102a5565b6102fe81856102af565b935061030e8185602086016102bf565b61031781610299565b840191505092915050565b6000825161032c81846020870161061a565b91905092915050565b6000608051905061034582610173565b600182526000602083015260006040830152600060608301525050565b610369816103a9565b82525050565b6000615f603d831115610383575f5f565b81610392576020830361039d565b5b602083015250565b6000602082019050610359565b600067ffffffffffffffff82111561060f565b61044f602061043e826103cd565b610335565b815f806040850101526040515f19603f811683016020018181108282111715610483575f5f565b505050603a019250603e81018261049a565b845151808503600101525050509190505f5b600082158061033f5750600082145b156103c7575f6103a955610359600161044f565b838252610567604084015161033f565b50825160208491036032820101526020808301519083015161058d575f61033f565b6105a5836104af5761048a565b610567604084015161033f565b508451602085015160408601516060870151608088015183016105e4575f6105b5565b845160208601516040870151606088015183016105e4575f6104bf565b509392505050565b815190600361060c60208301516103cd565b600583015250600a601f821461033f578c01515f19828c01015260206106416103cd565b8c602001515161064e60405f565b8d83015250610658610567565b5f85111561066883610658565b829450505050565b506106776102a5565b8151610681836102af565b6020820151818401525050600382019050919050565b5f61069f826106a5565b602082015181840152602082019150919050565b6106b58161006a565b810181811067ffffffffffffffff821117156106d4576106d361007a565b5b80604052505050565b5f6106e682610677565b602082015181840152602082019150919050565b81835260007f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8212156107245750505050565b600182019150602081825f5f85851161073d5750505050565b5f855f830111156107535750826000602086030191505b5f602084610764565b602089888581010301821315610776575f85555050505050565b6107806106db565b835f84820101526020810190506107948183870161066e565b5050505050565b508201818101505f5b83811015610b7f576107b881858601610b66565b60208101905081610b5650505050565b9190915050565b5f8151905092915050565b5f82601f8301126107e6575f5ffd5b81516107f4848260208601610b66565b91505092915050565b5f67ffffffffffffffff811115610b60565b610b4a60208651610b60565b5f615f60888110156108b3575f5f565b602084510151808603610898575f828601526108a4565b84518101602085015250505b5050803582858101015f610b47565b615f82840312156108d1576108d0825f5b5b50610b43565b600382870301915f6108e2565b600783870301915f610b40565b600483870301915f610b3d565b600183870301915f610b3a565b600583870301915f610b37565b600683870301915f610b34565b600283870301915f610b31565b5050505050565b5050603a0192507f010000000000000000000000000000000000000000000000000000000000000082016020018181108282111715610b28575f5f565b50610b1f565b5050509190505050565b5050505050610b0e565b610b5650612a55565b610afb816102bf565b5060010190610aa8565b5082848301548110610ac8578381018401518582018501945060010161098c565b5f5b83811015610a815783820151818401526020810190505f5b838110156610a6a578185018901518387019701526020810190506109fb565b5f5b610a5357818101860151858201870152602001610a36565b5f838801525050505050565b5f82610a15565b610a248262061a565b91505092915050565b5f82610a36565b610a478262061a565b91505092915050565b5f8315610997565b61096e82610961565b825101905082525050565b61097c826102bf565b91505092915050565b5061099b816102bf565b9150506109ce565b5f5050505050505050565b336109e78254610954565b600281905550919050565b5f6128b34381019050610a12565b61024a610a9f565b610a1c836109e3565b60208201528260208301526020820152919050565b610a2f836109e3565b6040850152608084015260a0830152610a54565b60408601525050565b610a63836102bf565b91505092915050565b61071b60b983610a6a565b825260208201526040810190506020820152602081019050919050565b5f80610a81565b61071b60b9836102af565b825260208201526040810190505f805b83811015610a9f5783820151818401526020810190505061071b565b5f5050505050565b50919050565b9392505050565b5f61560b565b618047610af2565b610afe8260409101615b7d565b8560248301526036820152905092915050565b610b118383610afb565b5050505050565b7f4e481b712b000000000000000000000000000000000000000000000000000000908152602085015283600487016000855f8311158290610b495750600061083b565b50600183015f1983169050828503610b565750506104bb565b5f5b83811015610b74578085016020810160018601018501610b58565b5f1b8101905082850161071b565b50505050506104bb565b610b6681610b9f565b565b615f80fd5b505050505050505050565b505050505050505050565b8351602085015160408601516060870151608088015185019150505050505050565b5f5f5f60405190808252806020026020018201604052801561052f57816020015f208360208701015f915061053d565b5f915050610535565b61053f603d565b8151908301906105a0565b6105ba8261006a565b810181811067ffffffffffffffff821117156105d9576105d861007a565b5b80604052505050565b5f6105ed61004f565b90506105f98282610173565b919050565b5f6106076105ba565b604051905090565b61061881610299565b5f830354838301525f3d14602082015250565b5f819050919050565b634e487b7100000000000000000000000000000000000000000000000000000000525f52602260045260245f5b60006106655f83106106415761064061062f565b5f8092919050565b600160ff1b8314156103f2575f6103f255565b818102815f19840184811184821017156103ea576103e961062f565b5060010192915050565b6000819050919050565b505f830553835f601f909101831690505f50505050565b50600090565b5f8190505f838510156104cb575f8190555b508190508094505050505f505f505f505f5050610541565b610542"
}; 