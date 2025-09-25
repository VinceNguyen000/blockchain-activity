require("dotenv").config();
const { ethers } = require("hardhat");
// Paste the address printed by deploy.js
const TOKEN = process.env.DEPLOYED_ADDRESS;
async function main() {
  if (!TOKEN) throw new Error("Set TOKEN address in scripts/interact.js");
  const [deployer, acct2] = await ethers.getSigners();
  const token = await ethers.getContractAt("CampusCredit", TOKEN, deployer);
  // Helper to print balances
  async function balances(label) {
    const b1 = await token.balanceOf(deployer.address);
    const b2 = await token.balanceOf(acct2.address);
    console.log(
      `${label} | Deployer: ${ethers.formatUnits(
        b1,
        18
      )} CAMP | Acct2: ${ethers.formatUnits(b2, 18)} CAMP`
    );
  }
  await balances("Before");
  // Transfer #1 with lower priority tip
  const tx1 = await token.transfer(
    acct2.address,
    ethers.parseUnits("100", 18),
    {
      maxPriorityFeePerGas: 1_000_000_000n,
      maxFeePerGas: 20_000_000_000n,
    } // 1 gwei tip
  );
  console.log("Tx1 hash:", tx1.hash);
  const rcpt1 = await tx1.wait();
  console.log("Tx1 mined in block:", rcpt1.blockNumber);
  // Transfer #2 with higher priority tip
  const tx2 = await token.transfer(
    acct2.address,
    ethers.parseUnits("50", 18),
    {
      maxPriorityFeePerGas: 3_000_000_000n,
      maxFeePerGas: 22_000_000_000n,
    } // 3 gwei tip
  );
  console.log("Tx2 hash:", tx2.hash);
  const rcpt2 = await tx2.wait();
  console.log("Tx2 mined in block:", rcpt2.blockNumber);
  // Approval: allow acct2 to spend 25 CAMP
  const tx3 = await token.approve(
    acct2.address,
    ethers.parseUnits("25", 18),
    {
      maxPriorityFeePerGas: 2_000_000_000n,
      maxFeePerGas: 21_000_000_000n,
    } // 2 gwei tip
  );
  console.log("Tx3 hash:", tx3.hash);
  const rcpt3 = await tx3.wait();
  console.log("Tx3 mined in block:", rcpt3.blockNumber);
  await balances("After");
  console.log(
    "HASHES:",
    JSON.stringify({ tx1: tx1.hash, tx2: tx2.hash, tx3: tx3.hash }, null, 2)
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
