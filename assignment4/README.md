# DIDLab DApp

This repository contains the decentralized application (DApp) for DIDLab activities.

---

## Project Info

- **Team Number:** 3
- **RPC URL:** https://hh-03.didlab.org
- **Chain ID:** 31339
- **Token Address:** 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
- **Reciepient:** 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

---

## Running Locally

You can run the DApp locally in two ways:

### 1. python3 -m http.server 8000

### 2. npx http-server -p 8000

then open http://localhost:8000

# Short Note:

## Any extra safety checks/UX touches you added:

- **Added validation + friendly errors**

```js

function isPositiveNumberLike(s){ return /^\d+(\.\d+)?$/.test(s) && Number(s) > 0; }

function handleErr(e){
  const msg = e?.shortMessage || e?.message || String(e);
  if (/insufficient funds/i.test(msg)) return logErr("Insufficient funds for gas or transfer.");
  if (e?.code === 4001 || /user rejected/i.test(msg)) return logErr("Request cancelled.");
  logErr(msg);
  console.error(e);
}
- **Network guard in connec()**
const curHex = await window.ethereum.request({ method: "eth_chainId" });
const curId = parseInt(curHex, 16);
if (curId !== chain.id) {
  throw new Error(`Wrong network: expected ${chain.name} (#${chain.id}), got chainId ${curId}`);
}
```

- **Safer Send()**
  -- Validates recipient address (and not self).
  -- Validates positive amount.
  -- Checks token balance before sending.
  -- Shows a confirm() dialog with amount/to/network.
  -- Submits tx and logs receipt.

## Any issues you hit and how you fixed them:

I do not have
