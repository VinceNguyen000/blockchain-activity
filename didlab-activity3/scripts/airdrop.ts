import "dotenv/config";
import { artifacts } from "hardhat";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

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

  // >>> Paste 3–6 recipient addresses for your team here (teammates + self ok)
  const recipients = [
    getAddress(account.address),
    "0xa0ee7a142d267c1f36714e4a8f75612f20a79720", //account 9
    "0xbcd4042de499d14e55001ccbb24a551f3b954096", //account 10
    "0x71bE63f3384f5fb98995898A86B02Fb2426c5788", //account 11
    "0xfabb0ac9d68b0b445fb7357272ff202c5651694a", //account 12
    "0x1c5630a4c1d3a859b1ceaa2beedbc635e5f9eac5", //account 13
    "0x8e870d67f660d95d5be530380d0ec0bd388289e1", //account 14
  ];
  const amounts = recipients.map(() => parseUnits("10", 18));

  // One batch airdrop
  const txBatch = await wallet.writeContract({
    address: TOKEN,
    abi,
    functionName: "airdrop",
    args: [recipients, amounts],
    maxPriorityFeePerGas: 2_000_000_000n,
    maxFeePerGas: 22_000_000_000n,
  });
  const rBatch = await publicClient.waitForTransactionReceipt({
    hash: txBatch,
  });
  const feeBatch = rBatch.gasUsed * (rBatch.effectiveGasPrice ?? 0n);
  console.log(
    "Airdrop:",
    txBatch,
    "gasUsed:",
    rBatch.gasUsed.toString(),
    "fee(wei):",
    feeBatch.toString()
  );

  // N individual transfers (compare)
  let totalGas = 0n,
    totalFee = 0n;
  for (let i = 0; i < recipients.length; i++) {
    const tx = await wallet.writeContract({
      address: TOKEN,
      abi,
      functionName: "transfer",
      args: [recipients[i], amounts[i]],
      maxPriorityFeePerGas: 2_000_000_000n,
      maxFeePerGas: 22_000_000_000n,
    });
    const r = await publicClient.waitForTransactionReceipt({ hash: tx });
    totalGas += r.gasUsed;
    totalFee += r.gasUsed * (r.effectiveGasPrice ?? 0n);
  }
  console.log(
    "Singles total gasUsed:",
    totalGas.toString(),
    "fee(wei):",
    totalFee.toString()
  );

  if (totalGas > 0n) {
    const saved = (
      (Number(totalGas - rBatch.gasUsed) / Number(totalGas)) *
      100
    ).toFixed(2);
    console.log(`Batch saved ≈ ${saved}% gas vs singles`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
