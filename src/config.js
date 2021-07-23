module.exports = {
    ETH_CONTRACT_ADDR: "0x9b31b02d94f4485ecb37026dac353fa5d17c68c7",
    BSC_CONTRACT_ADDR: "0x3932253F174C2f29cFFb7f21445EdDd31A1C1afE",
    API_KEY: "5YATSWAEY3FECGIZARPMHIK8W59T16Z2U4",
    BEP20_ABI: [
        {
          "constant":false,
          "inputs":[
            {
              "internalType":"address",
              "name":"spender","type":"address"
            },
            {
              "internalType":"uint256",
              "name":"amount","type":"uint256"
            }
          ],
          "name":"approve",
          "outputs":[
            {
              "internalType":"bool",
              "name":"","type":"bool"
            }
          ],
          "payable":false,
          "stateMutability":"nonpayable",
          "type":"function"
        },
        {
            "constant":true,
            "inputs":[
              {
                "internalType":"address",
                "name":"owner",
                "type":"address"
              },
              {
                "internalType":"address",
                "name":"spender",
                "type":"address"
              }
            ],
            "name":"allowance",
            "outputs":[
              {
                "internalType":"uint256",
                "name":"",
                "type":"uint256"
              }
            ],
            "payable":false,
            "stateMutability":"view",
            "type":"function"
        }
    ],
    MULTISENDER_ABI: [
        {
            "inputs": [],
            "name": "arrayLimit",
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
                    "internalType": "address",
                    "name": "_customer",
                    "type": "address"
                }
            ],
            "name": "currentFee",
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
                    "internalType": "address",
                    "name": "_customer",
                    "type": "address"
                }
            ],
            "name": "discountRate",
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
            "inputs": [],
            "name": "discountStep",
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
            "inputs": [],
            "name": "fee",
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
                    "internalType": "address payable[]",
                    "name": "_contributors",
                    "type": "address[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "_balances",
                    "type": "uint256[]"
                }
            ],
            "name": "multisendEther",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                },
                {
                    "internalType": "address payable[]",
                    "name": "_contributors",
                    "type": "address[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "_balances",
                    "type": "uint256[]"
                }
            ],
            "name": "multisendToken",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ]

}
