require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      // Enable EIP-1559 fields locally (set a nonzero base fee)
      initialBaseFeePerGas: 1_000_000_000, // 1 gwei
      // You can also add chainId: 31337 (default) if you plan to connect MetaMask later
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};