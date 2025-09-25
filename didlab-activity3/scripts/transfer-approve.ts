import "dotenv/config";
import { artifacts } from "hardhat";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

const RECIPIENT = process.env.RECIPIENT || ""; // optional teammate address

async function main() {
  if (!RPC_URL || !CHAIN_ID || !PRIVATE_KEY || !TOKEN)
    throw new Error("Missing env");

  const { abi } = await artifacts.readArtifact("CampusCreditV2");
  const chain = {
    id: CHAIN_ID,
    name: `didlab-${CHAIN_ID}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  } as const;

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  const wallet = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });
  const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

  const me = getAddress(account.address);
  const you = RECIPIENT ? getAddress(RECIPIENT) : me; // fallback self

  const bal = async (label: string) => {
    const bMe = (await publicClient.readContract({
      address: TOKEN,
      abi,
      functionName: "balanceOf",
      args: [me],
    })) as bigint;
    const bYou = (await publicClient.readContract({
      address: TOKEN,
      abi,
      functionName: "balanceOf",
      args: [you],
    })) as bigint;
    console.log(
      `${label} | Me: ${formatUnits(bMe, 18)} CAMP | You: ${formatUnits(
        bYou,
        18
      )} CAMP`
    );
  };

  await bal("Before");

  // Transfer 100 CAMP (lower tip)
  const tx1 = await wallet.writeContract({
    address: TOKEN,
    abi,
    functionName: "transfer",
    args: [you, parseUnits("100", 18)],
    maxPriorityFeePerGas: 1_000_000_000n,
    maxFeePerGas: 20_000_000_000n,
  });
  const r1 = await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("transfer tx:", tx1, "gasUsed:", r1.gasUsed.toString());

  // Approve 50 CAMP
  const tx2 = await wallet.writeContract({
    address: TOKEN,
    abi,
    functionName: "approve",
    args: [you, parseUnits("50", 18)],
    maxPriorityFeePerGas: 2_000_000_000n,
    maxFeePerGas: 21_000_000_000n,
  });
  const r2 = await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("approve  tx:", tx2, "gasUsed:", r2.gasUsed.toString());

  // Show allowance
  const alw = (await publicClient.readContract({
    address: TOKEN,
    abi,
    functionName: "allowance",
    args: [me, you],
  })) as bigint;
  console.log("allowance:", formatUnits(alw, 18), "CAMP");

  await bal("After");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
