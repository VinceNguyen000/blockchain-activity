import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
//import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const RPC_URL = process.env.RPC_URL || "";
const CHAIN_ID = process.env.CHAIN_ID
  ? Number(process.env.CHAIN_ID)
  : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    didlab: {
      type: "http",
      url: RPC_URL,
      chainId: CHAIN_ID,
    },
  },
};

export default config;
