import "dotenv/config";

// Required env (see next step)
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CHAIN_ID = Number(process.env.CHAIN_ID || "0");

export default {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // Your team’s DIDLab chain (HTTP)
    didlab: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      // Hardhat v3 HTTP network
      type: "http",
    },
    // Local fallback if you ever need it (not used in this assignment)
    hardhat: {
      type: "edr-simulated",
      initialBaseFeePerGas: 1_000_000_000, // 1 gwei for EIP-1559 fields
    },
  },
};
