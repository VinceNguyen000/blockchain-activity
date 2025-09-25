import "dotenv/config";
import { artifacts } from "hardhat";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  getAddress,
  formatUnits,
  decodeEventLog,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

async function main() {
  if (!RPC_URL || !CHAIN_ID || !PRIVATE_KEY || !TOKEN) {
    throw new Error(
      "Missing env (RPC_URL, CHAIN_ID, PRIVATE_KEY, TOKEN_ADDRESS)"
    );
  }

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

  // --- 3–6 recipients (self + teammates ok). Use checksummed addresses.
  const recipients: `0x${string}`[] = [
    getAddress(account.address),
    getAddress("0xa0ee7a142d267c1f36714e4a8f75612f20a79720"), // 9
    getAddress("0xbcd4042de499d14e55001ccbb24a551f3b954096"), // 10
    getAddress("0x71bE63f3384f5fb98995898A86B02Fb2426c5788"), // 11
    getAddress("0xfabb0ac9d68b0b445fb7357272ff202c5651694a"), // 12
  ];
  const amounts = recipients.map(() => parseUnits("10", 18)); // positive amounts

  const fmtWei = (x: bigint) => `${x.toString()} wei`;

  // --- Batch airdrop
  const txBatch = await wallet.writeContract({
    address: TOKEN,
    abi,
    functionName: "airdrop",
    args: [recipients, amounts],
  });
  const rBatch = await publicClient.waitForTransactionReceipt({
    hash: txBatch,
  });
  const feeBatch = rBatch.gasUsed * (rBatch.effectiveGasPrice ?? 0n);
  console.log(
    "Airdrop tx:",
    txBatch,
    "| block:",
    rBatch.blockNumber?.toString(),
    "| gasUsed:",
    rBatch.gasUsed.toString(),
    "| effectiveGasPrice:",
    (rBatch.effectiveGasPrice ?? 0n).toString(),
    "| totalFee:",
    fmtWei(feeBatch)
  );

  // --- Singles
  let totalGasSingles = 0n;
  let totalFeeSingles = 0n;

  for (let i = 0; i < recipients.length; i++) {
    const tx = await wallet.writeContract({
      address: TOKEN,
      abi,
      functionName: "transfer",
      args: [recipients[i], amounts[i]],
    });
    const r = await publicClient.waitForTransactionReceipt({ hash: tx });
    const fee = r.gasUsed * (r.effectiveGasPrice ?? 0n);

    console.log(
      `Single #${i + 1} tx:`,
      tx,
      "| block:",
      r.blockNumber?.toString(),
      "| gasUsed:",
      r.gasUsed.toString(),
      "| effectiveGasPrice:",
      (r.effectiveGasPrice ?? 0n).toString(),
      "| totalFee:",
      fmtWei(fee),
      "| to:",
      recipients[i],
      "| amount:",
      formatUnits(amounts[i], 18)
    );

    totalGasSingles += r.gasUsed;
    totalFeeSingles += fee;
  }

  // --- REQUIRED concise summary (gas + % saved), plus fees for clarity
  const gasSavedPct =
    Number(totalGasSingles) > 0
      ? (
          (Number(totalGasSingles - rBatch.gasUsed) / Number(totalGasSingles)) *
          100
        ).toFixed(2)
      : "0.00";
  console.log(
    `Summary: batch gasUsed=${rBatch.gasUsed.toString()} (fee=${fmtWei(
      feeBatch
    )}) vs singles gasUsed=${totalGasSingles.toString()} (fee=${fmtWei(
      totalFeeSingles
    )}) -> saved ≈ ${gasSavedPct}%`
  );

  // =========================
  // Logs & Events — limit to recent blocks to avoid stale/mismatched ABI logs
  // =========================
  const latest = await publicClient.getBlockNumber();
  // Use a tight window around the airdrop block to avoid old redeploys
  const window = 200n;
  const fromBlock =
    rBatch.blockNumber && rBatch.blockNumber > window
      ? rBatch.blockNumber - window
      : 0n;

  const ERC20_Transfer = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  );
  const ERC20_Approval = parseAbiItem(
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  );

  // ---------- Transfer events ----------
  const transferLogs = await publicClient.getLogs({
    address: TOKEN,
    fromBlock,
    toBlock: latest,
  });

  console.log(
    `\nRecent Transfer events (from block ${fromBlock} to ${latest}):`
  );
  for (const log of transferLogs) {
    const { topics, data, blockNumber, transactionHash } = log as any;

    // Try artifact ABI first
    let from: string | undefined, to: string | undefined;
    let value: bigint | undefined;
    try {
      const dec = decodeEventLog({ abi, topics, data });
      if (dec.eventName === "Transfer") {
        const a = dec.args as any;
        // Support both named & positional
        from = a.from ?? a[0];
        to = a.to ?? a[1];
        value = (a.value ?? a[2]) as bigint | undefined;
      }
    } catch {
      /* fall through to standard ERC20 */
    }
    // If not decoded yet, try standard ERC20 Transfer
    if (value === undefined && topics?.length) {
      try {
        const dec = decodeEventLog({ abi: [ERC20_Transfer], topics, data });
        const a = dec.args as any;
        from = a.from;
        to = a.to;
        value = a.value as bigint;
      } catch {
        /* ignore */
      }
    }

    // Skip if still not decodable (likely from older incompatible deployments)
    if (value === undefined) continue;

    console.log(
      "block:",
      blockNumber?.toString(),
      "| tx:",
      transactionHash,
      "| from:",
      from,
      "| to:",
      to,
      "| value:",
      formatUnits(value, 18)
    );
  }

  // ---------- Approval events ----------
  const approvalLogs = await publicClient.getLogs({
    address: TOKEN,
    fromBlock,
    toBlock: latest,
  });

  console.log(
    `\nRecent Approval events (from block ${fromBlock} to ${latest}):`
  );
  for (const log of approvalLogs) {
    const { topics, data, blockNumber, transactionHash } = log as any;

    let owner: string | undefined, spender: string | undefined;
    let value: bigint | undefined;
    try {
      const dec = decodeEventLog({ abi, topics, data });
      if (dec.eventName === "Approval") {
        const a = dec.args as any;
        owner = a.owner ?? a[0];
        spender = a.spender ?? a[1];
        value = (a.value ?? a[2]) as bigint | undefined;
      }
    } catch {
      /* try standard ERC20 next */
    }
    if (value === undefined && topics?.length) {
      try {
        const dec = decodeEventLog({ abi: [ERC20_Approval], topics, data });
        const a = dec.args as any;
        owner = a.owner;
        spender = a.spender;
        value = a.value as bigint;
      } catch {
        /* ignore */
      }
    }

    if (value === undefined) continue;

    console.log(
      "block:",
      blockNumber?.toString(),
      "| tx:",
      transactionHash,
      "| owner:",
      owner,
      "| spender:",
      spender,
      "| value:",
      formatUnits(value, 18)
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
