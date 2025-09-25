# DIDLab Assignment 2 — Report

## Part A — Deployment

- **Contract address**: `0x5fbdb2315678afecb367f032d93f642f64180aa3`  
- **Symbol**: CAMP  
- **Decimals**: 18  
- **Initial supply**:  
  - Human: `1,000,000 CAMP`  
  - Raw: `1000000000000000000000000`  

- **Compiler version**: 0.8.24  
- **Scripts used**: `deploy.ts`, `interact.ts`, `analyze.ts`  

**Deployment tx**  
- Tx hash: `0xb6edeaf7fd1810f69d964dd0967ed4d1fd97d5c314c6fa4aad018a56738158d8`  
- Deployer: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
- Block: #1  
- Gas used: 546,031  
- Value: 0 ETH  

---

## Part B — Transaction Details

### Tx1 — transfer 100 CAMP
- Hash: `0x01073e1f0cdcba87085796305e4e587b580cc4f878fe25ee4bca643eb0cf01c4`  
- Status: Success  
- Block: 2  
- Timestamp (UTC): 2025-09-18T19:10:26Z  
- From: `0xf39f...92266` (EOA)  
- To: `0x5fbd...0aa3` (CampusCredit contract)  
- Nonce: 1  
- Gas limit: 51,626  
- Gas used: 51,626  
- Base fee: 0.769606477 gwei  
- Max fee: 20 gwei  
- Max priority fee: 1 gwei  
- Effective gas price: 1.769606477 gwei  
- Total fee: 0.000091357703981602 ETH  
- **Event**: Transfer → 100 CAMP  

### Tx2 — transfer 50 CAMP
- Hash: `0xf4c60f9572503ef31240635f716a2680659e5ca30da3145ca7447a3674ae3c4e`  
- Status: Success  
- Block: 3  
- Timestamp (UTC): 2025-09-18T19:10:27Z  
- From: `0xf39f...92266` (EOA)  
- To: `0x5fbd...0aa3` (CampusCredit contract)  
- Nonce: 2  
- Gas limit: 34,526  
- Gas used: 34,526  
- Base fee: 0.673736765 gwei  
- Max fee: 22 gwei  
- Max priority fee: 3 gwei  
- Effective gas price: 3.673736765 gwei  
- Total fee: 0.00012683943554839 ETH  
- **Event**: Transfer → 50 CAMP  

### Tx3 — approve 25 CAMP
- Hash: `0xf831deb73f6869d27e811b351a3e5ad13651aaf21c61aa944a8d9d378aafb4f4`  
- Status: Success  
- Block: 4  
- Timestamp (UTC): 2025-09-18T19:10:28Z  
- From: `0xf39f...92266` (EOA)  
- To: `0x5fbd...0aa3` (CampusCredit contract)  
- Nonce: 3  
- Gas limit: 46,379  
- Gas used: 46,379  
- Base fee: 0.589713515 gwei  
- Max fee: 21 gwei  
- Max priority fee: 2 gwei  
- Effective gas price: 2.589713515 gwei  
- Total fee: 0.000120108323112185 ETH  
- **Event**: Approval → 25 CAMP  

---

## Part C — Fee Comparison

- **Which landed first?** Tx1 (block 2).  
- **Which had higher effective gas price?** Tx2 (3.67 gwei vs 1.77 gwei).  
- **Which had higher priority tip?** Tx2 (3 gwei vs 1 gwei).  

**EIP-1559 explanation:**  
- Each block sets a **base fee** (burned).  
- Senders add a **priority fee (tip)** to incentivize miners.  
- The **effective gas price** = base fee + priority fee (up to your max fee).  
- Transactions with higher tips are mined sooner.

---

## Part D — Decimals & Conversion

Example from Tx1 event:  
- Raw value: `100000000000000000000`  
- Decimals: 18  
- Human value: 100 CAMP  
- Formula: `human = raw / 1e18`

---

## Balances

- **Before**: Deployer = 1,000,000 CAMP, Acct2 = 0 CAMP  
- **After**: Deployer = 999,850 CAMP, Acct2 = 150 CAMP  
