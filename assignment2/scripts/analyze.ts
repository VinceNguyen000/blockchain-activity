import { artifacts } from "hardhat";
import { createPublicClient, http, decodeEventLog } from "viem";

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);

// Paste from interact output
const HASHES = {
  tx1: "0x01073e1f0cdcba87085796305e4e587b580cc4f878fe25ee4bca643eb0cf01c4",
  tx2: "0xf4c60f9572503ef31240635f716a2680659e5ca30da3145ca7447a3674ae3c4e",
  tx3: "0xf831deb73f6869d27e811b351a3e5ad13651aaf21c61aa944a8d9d378aafb4f4",
};

async function analyze(hash: `0x${string}`, abi: any) {
  const chain = {
    id: CHAIN_ID,
    name: `didlab-${CHAIN_ID}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  };
  const pc = createPublicClient({ chain, transport: http(RPC_URL) });

  const tx = await pc.getTransaction({ hash });
  const rcpt = await pc.getTransactionReceipt({ hash });
  const block = await pc.getBlock({ blockNumber: rcpt.blockNumber });

  const baseFee = block.baseFeePerGas ?? 0n;
  const gasUsed = rcpt.gasUsed ?? 0n;
  const effective = rcpt.effectiveGasPrice ?? tx.gasPrice ?? 0n;
  const totalFee = gasUsed * effective;
  console.log(`\n=== ${hash} ===`);
  console.log("Status:", rcpt.status === "success" ? "Success" : "Fail");
  console.log("Block:", rcpt.blockNumber);
  console.log(
    "Timestamp (UTC):",
    new Date(Number(block.timestamp) * 1000).toISOString()
  );
  console.log("From:", tx.from);
  console.log("To:", tx.to);
  console.log("Nonce:", tx.nonce);
  console.log("Gas limit:", tx.gas);
  console.log("Gas used:", gasUsed);
  console.log("Base fee per gas:", baseFee);
  console.log("Max fee per gas:", tx.maxFeePerGas ?? 0n);
  console.log("Max priority fee per gas:", tx.maxPriorityFeePerGas ?? 0n);
  console.log("Effective gas price:", effective);
  console.log("Total fee (wei):", totalFee);

  for (const log of rcpt.logs) {
    try {
      const parsed = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
      });
      console.log("Event:", parsed.eventName, parsed.args);
    } catch {
      /* not a CampusCredit event */
    }
  }
}

async function main() {
  const { abi } = await artifacts.readArtifact("CampusCredit");
  await analyze(HASHES.tx1 as `0x${string}`, abi);
  await analyze(HASHES.tx2 as `0x${string}`, abi);
  await analyze(HASHES.tx3 as `0x${string}`, abi);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
