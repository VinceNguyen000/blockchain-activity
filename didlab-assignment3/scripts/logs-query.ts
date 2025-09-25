import "dotenv/config";
import { createPublicClient, http, decodeEventLog, parseAbiItem } from "viem";

// ENV
const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

async function main() {
  if (!RPC_URL || !CHAIN_ID || !TOKEN)
    throw new Error("Missing env (RPC_URL, CHAIN_ID, TOKEN_ADDRESS)");

  const chain = {
    id: CHAIN_ID,
    name: `didlab-${CHAIN_ID}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  } as const;

  const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

  // Look back ~2000 blocks
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > 2000n ? latest - 2000n : 0n;

  // Standard ERC-20 event fragments (works across V1/V2/most ERC20s)
  const ERC20_Transfer = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  );
  const ERC20_Approval = parseAbiItem(
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  );

  // Fetch all logs for the token in the window
  const logs = await publicClient.getLogs({
    address: TOKEN,
    fromBlock,
    toBlock: latest,
  });

  // Buckets
  const transfers: Array<{
    block: bigint;
    tx: `0x${string}`;
    from: string;
    to: string;
    value: bigint;
  }> = [];
  const approvals: Array<{
    block: bigint;
    tx: `0x${string}`;
    owner: string;
    spender: string;
    value: bigint;
  }> = [];

  for (const log of logs) {
    const { topics, data, blockNumber, transactionHash } = log as any;

    // Try decode as Transfer
    try {
      const dec = decodeEventLog({ abi: [ERC20_Transfer], topics, data });
      if (dec.eventName === "Transfer") {
        const a = dec.args as any;
        transfers.push({
          block: blockNumber as bigint,
          tx: transactionHash,
          from: a.from,
          to: a.to,
          value: a.value as bigint,
        });
        continue; // done with this log
      }
    } catch {
      /* not a Transfer */
    }

    // Try decode as Approval
    try {
      const dec = decodeEventLog({ abi: [ERC20_Approval], topics, data });
      if (dec.eventName === "Approval") {
        const a = dec.args as any;
        approvals.push({
          block: blockNumber as bigint,
          tx: transactionHash,
          owner: a.owner,
          spender: a.spender,
          value: a.value as bigint,
        });
        continue;
      }
    } catch {
      /* not an Approval */
    }

    // Ignore other events (or incompatible old deployments)
  }

  // Print
  console.log(
    `\nTransfer events (from block ${fromBlock} to ${latest}) [${transfers.length} found]:`
  );
  for (const ev of transfers) {
    console.log(
      `[${ev.block.toString()}] Transfer tx=${ev.tx} from=${ev.from} to=${
        ev.to
      } value=${ev.value.toString()}`
    );
  }

  console.log(
    `\nApproval events (from block ${fromBlock} to ${latest}) [${approvals.length} found]:`
  );
  for (const ev of approvals) {
    console.log(
      `[${ev.block.toString()}] Approval tx=${ev.tx} owner=${
        ev.owner
      } spender=${ev.spender} value=${ev.value.toString()}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
