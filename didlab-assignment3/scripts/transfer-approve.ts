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

  const { abi } = await artifacts.readArtifact("CampusCredit");
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
  const fee1 = r1.effectiveGasPrice ? r1.gasUsed * r1.effectiveGasPrice : 0n;
  console.log(
    "transfer tx:",
    tx1,
    "| block:",
    r1.blockNumber?.toString(),
    "| gasUsed:",
    r1.gasUsed.toString(),
    "| effectiveGasPrice:",
    r1.effectiveGasPrice?.toString() ?? "n/a",
    "| totalFee(wei):",
    fee1.toString()
  );

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
  const fee2 = r2.effectiveGasPrice ? r2.gasUsed * r2.effectiveGasPrice : 0n;
  console.log(
    "approve  tx:",
    tx2,
    "| block:",
    r2.blockNumber?.toString(),
    "| gasUsed:",
    r2.gasUsed.toString(),
    "| effectiveGasPrice:",
    r2.effectiveGasPrice?.toString() ?? "n/a",
    "| totalFee(wei):",
    fee2.toString()
  );

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
