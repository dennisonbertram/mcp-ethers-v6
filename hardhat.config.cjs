require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "100000000000000000000000000000000000000" // 100 trillion ETH
      },
      mining: {
        auto: true,
        interval: 0
      }
    }
  }
};
