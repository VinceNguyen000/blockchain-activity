# DIDLab Assignment 3 — Scripts

This repo includes two Hardhat scripts:

- `scripts/deploy.ts` - Deploy script (Viem, EIP-1559)
- npx hardhat run scripts/deploy.ts --network didlab
- `scripts/transfer-approve.ts` - Deploys ERC-20 token using constructor params from .env (name, symbol, cap, initialReceiver, initialMint)
- npx hardhat run scripts/transfer-approve.ts --network didlab
- `scripts/airdrop.ts` — Performs a **batch airdrop** and then **N single transfers** of the same total amount, printing gas/fees and a one-line summary showing the % gas saved (or not)
- npx hardhat run scripts/airdrop.ts --network didlab
- `scripts/logs-query.ts` — Queries recent **ERC-20 Transfer** and **Approval** events for your token and prints the key arguments.
- npx hardhat run scripts/logs-query.ts --network didlab

---

## Network (public info)

- **RPC URL:** `https://hh-03.didlab.org`
- **Chain ID:** `31339`
- **Token Address:** `get this address after you deploy`

---

## Short Write-Up

### a) Where I enforced: cap, pause, roles

- **Cap:** The token is capped at deployment time. Any mint that would push `totalSupply()` above the cap reverts. This guarantees fixed maximum supply.
- **Pause:** Transfers (and any mint/burn path that moves tokens) are blocked when the contract is paused. Only authorized operators can pause/unpause.
- **Roles:** Administrative actions are gated by roles:
  - `DEFAULT_ADMIN_ROLE` — can grant/revoke roles and manage configuration.
  - `PAUSER_ROLE` — can pause/unpause the token.
  - `MINTER_ROLE` — can mint (but still cannot exceed the cap).
    All state-changing admin functions check `onlyRole(...)`.

### b) Why batch airdrop saved gas (based on my run)

From my `scripts/airdrop.ts` run:
**Why batching wins:**

- You pay the **transaction base cost** and other per-tx overhead **once** instead of **N times**.
- Calldata and function dispatch overhead are **amortized** across recipients in the single batch call.
- Each recipient still incurs a storage write, but the fixed overhead dominates for small/medium N, so batching is cheaper.
- In my data, gas dropped from **176,448 → 76,511** (≈ **56.64%** saved). Fees showed a similar reduction (≈ **56.58%**).

### c) Issues encountered & fixes

- **Event args printed as `undefined` (logs):** Decoding with an ABI whose **event param names** didn’t match some historical logs caused `args.from/owner` to be `undefined`.
  - _Fix 1:_ In scripts that consume `getLogs({ abi, eventName })`, read event args **by position** (e.g., `[from, to, value] = args`) to avoid name mismatches.
  - _Fix 2:_ In the standalone log query, decode via the **standard ERC-20 fragments** with `parseAbiItem` + `decodeEventLog` so decoding doesn’t depend on my project’s artifact names.
- **Noisy/old logs on the dev chain:** Older deployments at the same address produced logs that didn’t match the current ABI.
  - _Fix:_ Restrict the query to a **recent block window** around the current actions (e.g., last 200–2000 blocks) and **skip undecodable entries**.
- **Submission requirement (summary line):** Ensured `airdrop.ts` prints a **single concise summary** comparing batch vs singles and the **% saved** as required.
