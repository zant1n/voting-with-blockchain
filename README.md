# voting-with-blockchain

This project is a beginner-friendly blockchain voting app:

- Smart contract: Solidity + local Ganache
- Frontend: Next.js + Ethers.js
- Wallet: MetaMask

If you are new, follow this guide from top to bottom.

## 1. What You Need Before Starting

Install these tools first:

1. Node.js 18+ (LTS recommended)
2. npm (comes with Node.js)
3. Ganache (GUI or CLI)
4. MetaMask browser extension
5. (Optional) Remix IDE for manual Solidity deployment

## 2. Project Structure (Quick View)

- `eth/`
  - Contract source code
  - Compile/deploy scripts
  - `contractInfo.json` (latest deployed address + ABI)
- `voting-dapp/`
  - Next.js frontend
  - Reads contract address from `.env.local`

## 3. First-Time Setup

Open terminal in project root, then run:

```bash
npm run setup
```

## 4. Start Ganache

1. Open Ganache.
2. Start a local chain at `http://127.0.0.1:8545`.
3. Keep Ganache running while using this project.

Important:

- Chain ID/NETWORK ID should be `1337`.
- If Ganache shows a different chain, update `.env.local` and MetaMask accordingly.

## 5. Add Ganache Network in MetaMask

In MetaMask -> Add network manually:

1. Network Name: `Ganache Local`
2. RPC URL: `http://127.0.0.1:8545`
3. Chain ID: `1337`
4. Symbol: `ETH`
5. Block Explorer URL: leave empty

In account -> add wallet -> import/select a Ganache account that has ETH.

## 6. Run Frontend

```bash
npm run dev
```
Enter a Ganache account address as admin address in terminal

Open `http://localhost:3000`.

## 7. How to Use the App

### Student / Voter Flow

1. Click `Connect Wallet`.
2. If prompted, approve network switch to `1337`.
3. Wait for candidates to load.
4. Vote for one candidate.

### Admin Flow

1. Switch to admin wallet account.
2. Use Admin Panel:
   - `Start Voting`
   - `End Voting`
   - `Add Candidate`
   - `Edit Candidate`

Rules:

- Voting must be active for users to vote.
- Add/Edit candidate is disabled while voting is active.

## 8. Common Errors and Fixes

### A) `No contract code found at ...`

Cause: Wrong contract address for current chain.

Fix:

1. Redeploy contract in `eth/`.
2. Copy new address from `eth/contractInfo.json`.
3. Update `voting-dapp/.env.local`.
4. Restart frontend.

### B) `MetaMask network mismatch`

Cause: Wallet is on wrong network.

Fix:

1. Switch MetaMask to `Ganache Local` chain `1337`.
2. Retry action.

### C) `contract.votingActive is not a function`

Cause: Frontend ABI does not match deployed contract.

Fix:

1. Run `npm run compile` in `eth/`.
2. Ensure frontend ABI file is synced from latest build.
3. Redeploy contract and update `.env.local`.

### D) `network changed: 1 => 1337`

Cause: Network changed during transaction signing.

Fix:

1. Accept MetaMask network switch first.
2. Retry the transaction.

## 9. Optional: Deploy via Remix (Manual)

If you prefer Remix:

1. Open `eth/Contract/voting.sol` in Remix.
2. Compile with Solidity `0.8.19`.
3. In advanced config, use EVM `paris` or `london`.
4. Deploy with Ganache provider `http://127.0.0.1:8545`.
5. Constructor argument example:

```json
["admin", "demouser1", "demouser2"]
```

6. Copy deployed address + ABI.
7. Update frontend env and ABI accordingly.

## 10. Quick Re-Run Checklist

If your classmate says "it does not work", check these 5 items first:

1. Ganache running on `127.0.0.1:8545`
2. MetaMask network is `1337`
3. `.env.local` contract address is latest deployed address
4. Frontend restarted after env change
5. Wallet account has ETH on Ganache
