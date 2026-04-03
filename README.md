# voting-with-blockchain

A beginner-friendly blockchain voting demo built with Solidity, Ganache, MetaMask, and a plain HTML/CSS/JS frontend.

This repository has two parts:

- `Contract/voting.sol`: the smart contract (election state, candidates, whitelist, voting)
- `frontend/`: the web UI that connects to MetaMask and calls the contract

## What You Will Build

You will run a local blockchain with Ganache, deploy the voting contract from Remix via MetaMask, connect the frontend to that contract, and test an end-to-end voting flow.

## Project Structure

```text
Contract/
  voting.sol
frontend/
  index.html
  styles.css
  config.js
  app.js
```

## Prerequisites

Install these tools first:

1. [Ganache](https://trufflesuite.com/ganache/) (Desktop)
2. [MetaMask](https://metamask.io/) browser extension
3. [Remix IDE](https://remix.ethereum.org/) (web app)
4. Python 3 (optional, only for serving static files)

## Quick Concepts (Important for Beginners)

- Chain ID is required by MetaMask custom networks. It is not always the same thing as Network ID.
- If Remix shows 0 ETH, you are usually connected to the wrong network/account.
- For this project, MetaMask must be connected to your Ganache local network.

## Step 1: Start Ganache

1. Open Ganache Desktop.
2. Create a new workspace (or use Quickstart).
3. Note these values from Ganache:
   - RPC URL (common: `http://127.0.0.1:7545`)
   - Chain ID (common: `1337`)
4. Keep Ganache running.

### Optional: Verify Chain ID from terminal

```bash
curl -s -X POST http://127.0.0.1:7545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

If result is `0x539`, your Chain ID is `1337`.

## Step 2: Add Ganache Network to MetaMask

In MetaMask:

1. Open network dropdown.
2. Click Add a custom network.
3. Fill fields:
   - Network name: `Ganache Local`
   - Default RPC URL: your Ganache RPC (example `http://127.0.0.1:7545`)
   - Chain ID: from Ganache (example `1337`)
   - Currency symbol: `ETH`
   - Block explorer URL: leave empty
4. Save.

## Step 3: Import a Ganache Account into MetaMask

1. In Ganache, pick one account with test ETH.
2. Copy its private key.
3. In MetaMask, click account menu -> Import account.
4. Paste private key and import.
5. Switch MetaMask to:
   - Ganache network
   - the imported account with balance

If you see `0 ETH`, you are likely on the wrong network or wrong account.

## Step 4: Compile and Deploy Contract from Remix

1. Open [Remix](https://remix.ethereum.org/).
2. Create/import `Contract/voting.sol`.
3. Go to Solidity Compiler tab.
4. Use compiler `0.8.x` and compile.
5. Go to Deploy & Run Transactions tab.
6. Set Environment to `Injected Provider - MetaMask`.
7. In MetaMask popup, approve connection and ensure selected account is your funded Ganache account.
8. Deploy `VotingSystem` and provide constructor inputs:
   - `title` (e.g. `Student Council 2026`)
   - `description` (e.g. `Annual campus election`)
9. Confirm the transaction in MetaMask.

After successful deploy, copy:

- contract address (from deployed contracts panel)
- full contract ABI (from Remix Compilation Details -> ABI)

## Step 5: Configure Frontend

Open `frontend/config.js` and update:

- `contractAddress`: paste deployed contract address
- `contractAbi`: paste ABI array

Example shape:

```javascript
window.APP_CONFIG = {
  contractAddress: "0xYourDeployedContractAddress",
  contractAbi: [
    // ... ABI objects from Remix
  ],
};
```

## Step 6: Run Frontend

From project root:

```bash
python3 -m http.server 5500
```

Open:

`http://localhost:5500/frontend/`

Then click Connect Wallet in the UI.

## Step 7: End-to-End Test Scenario

Use this exact order:

1. Connect as admin account (the deployer).
2. Add at least 2 candidates.
3. Add a second Ganache address to whitelist.
4. Start election.
5. Switch MetaMask to the whitelisted voter account.
6. Cast one vote.
7. Try voting again (should fail with double-vote protection).
8. Switch back to admin and close election.
9. Confirm final vote counts in results.

## Common Beginner Issues and Fixes

### 1) Remix shows 0 ETH

- MetaMask is not on Ganache network, or
- selected MetaMask account is not the imported Ganache account

Fix:

1. Switch MetaMask network to Ganache.
2. Choose imported funded account.
3. Reconnect Remix: MetaMask -> Connected sites -> disconnect Remix, then reconnect.

### 2) Cannot select the imported account in Remix

Fix:

1. In MetaMask, switch to desired account first.
2. Disconnect `remix.ethereum.org` from Connected sites.
3. Re-open Remix and reconnect; explicitly tick the account during authorization.

### 3) MetaMask rejects custom network

- Chain ID mismatch with RPC endpoint.

Fix:

1. Check Ganache Chain ID.
2. Verify using `eth_chainId` RPC call.
3. Recreate network in MetaMask with correct values.

### 4) Frontend says contract config missing

Fix:

- Ensure `frontend/config.js` has a non-empty `contractAddress` and valid `contractAbi` array.

### 5) Transactions fail from frontend

Possible reasons:

- wallet not connected
- wrong network
- using non-admin account for admin-only actions
- election state not correct (Setup/Active/Closed)

## Contract Features

- Admin-only actions: add candidates, whitelist voters, start/close election
- Whitelist enforcement for voting
- Election lifecycle states: `Setup`, `Active`, `Closed`
- One address can vote only once
- Events: `VoteCast`, `CandidateAdded`, `ElectionStarted`, `ElectionClosed`

## Useful Contract Methods

- `addCandidate(name, manifesto, imgHash)`
- `addVoterToWhitelist(voter)`
- `addVotersToWhitelist(voters)`
- `startElection()`
- `closeElection()`
- `vote(candidateId)`
- `getNumCandidates()`
- `getCandidate(candidateId)`
- `getTotalVotes()`
- `isEligibleToVote(voter)`

## Security Notes

- Never use Ganache private keys on real/public networks.
- This project is for local development and learning.
- Keep MetaMask on local Ganache network while testing.
