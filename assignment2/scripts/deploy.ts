import * as dotenv from "dotenv";
import { artifacts } from "hardhat";
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const PRIVATE_KEY_RAW = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");

// console.log("RPC_URL:", RPC_URL);
// console.log("CHAIN_ID:", CHAIN_ID);
// console.log("PRIVATE_KEY:", PRIVATE_KEY_RAW ? "loaded" : "MISSING");

async function main() {
  if (!RPC_URL || !CHAIN_ID || !PRIVATE_KEY_RAW)
    throw new Error("Missing env RPC_URL/CHAIN_ID/PRIVATE_KEY");

  // Load ABI + bytecode compiled by Hardhat
  const { abi, bytecode } = await artifacts.readArtifact("CampusCredit");

  // Viem chain object
  const chain = {
    id: CHAIN_ID,
    name: `didlab-${CHAIN_ID}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  };

  const account = privateKeyToAccount(`0x${PRIVATE_KEY_RAW}`);
  const wallet = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });
  const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

  // 1,000,000 CAMP (18 decimals)
  const initialSupply = parseUnits("1000000", 18);

  // Deploy
  const hash = await wallet.deployContract({
    abi,
    bytecode,
    args: [initialSupply],
  });
  console.log("Deploy tx:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress!;
  console.log("CampusCredit deployed at:", address);

  console.log("Deployer:", account.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
