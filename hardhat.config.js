import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    profiles: {
      default: {
        version: "0.8.20",
        settings: { evmVersion: "paris" } // or "london",
      },
    },
  },
  networks: {
    didlab: {
      type: "http",
      chainType: "l1",
      url: process.env.RPC_URL ?? "https://eth.didlab.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});