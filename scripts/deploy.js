import hre from "hardhat";
import { defineChain } from "viem";

const DIDLAB_CHAIN = defineChain({
  id: 252501,
  name: "DID Lab",
  network: "didlab",
  nativeCurrency: { name: "DID Token", symbol: "DID", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RPC_URL ?? "https://rpc.blockchain.didlab.org"] },
    public: { http: [process.env.RPC_URL ?? "https://rpc.blockchain.didlab.org"] },
  },
});

async function main() {
  const connection = await hre.network.connect({ network: "didlab" });
  const { viem } = connection;

  const publicClient = await viem.getPublicClient({ chain: DIDLAB_CHAIN });
  const [walletClient] = await viem.getWalletClients({ chain: DIDLAB_CHAIN });

  const badge = await viem.deployContract(
    "DidLabBadge",
    [walletClient.account.address],
    { client: { public: publicClient, wallet: walletClient } },
  );

  console.log("DidLabBadge:", badge.address);
  await connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});