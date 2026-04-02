# voting-with-blockchain

This project is a blockchain voting system built with Solidity, Ganache, and MetaMask. It is split into two parts:

- `Contract/voting.sol`: the smart contract that manages election state, candidates, whitelisted voters, and voting logic
- `frontend/`: a plain HTML, CSS, and JavaScript frontend that connects to MetaMask, calls the contract, and renders the UI

## Features

### Smart Contract

- Role-based access control: only the `admin` can add candidates, whitelist voters, and start or end the election
- Whitelist voting: only approved addresses can vote
- Election lifecycle control: `Setup`, `Active`, and `Closed`
- Anti-double-voting protection: each address can vote only once
- Events: `VoteCast`, `CandidateAdded`, `ElectionStarted`, and `ElectionClosed`

### Frontend

- MetaMask connection
- Admin dashboard for adding candidates, whitelisting voters, and starting or ending the election
- Voter interface for viewing candidates, checking eligibility, submitting votes, and viewing results

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

## Requirements

- Install [Ganache](https://trufflesuite.com/ganache/)
- Install [MetaMask](https://metamask.io/)
- Have [Remix IDE](https://remix.ethereum.org/) available

## Phase 1: Deploy the Smart Contract

### 1. Start Ganache

1. Open Ganache
2. Create a new local workspace or use the default workspace
3. Confirm the RPC URL and Chain ID
4. Copy one account to use as the `admin`

### 2. Compile and Deploy with Remix

1. Open Remix
2. Import `Contract/voting.sol`
3. Select a Solidity compiler version in the `0.8.x` range
4. Connect Remix to `Injected Provider - MetaMask`
5. Switch MetaMask to the Ganache network
6. Deploy the contract and provide:
   - `title`: the election title
   - `description`: the election description

### 3. Record the Deployment Data

After deployment, copy the following into `frontend/config.js`:

- Contract address
- Contract ABI

## Phase 2: Run the Frontend

If you use VS Code Live Server, you can open `frontend/index.html` directly.

If you do not use Live Server, any static server will work. For example:

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500/frontend/`

## Phase 3: Test Flow

1. Log in to the frontend with the `admin` wallet
2. Add at least 2 candidates
3. Add the test voter address to the whitelist
4. Start the election
5. Switch to the voter wallet and cast a vote
6. Try voting again and confirm the error message `You can not double vote!`
7. End the election and verify that results are displayed

## Contract API

The main contract methods are:

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

## Notes

- `voteCount` uses `uint256` to avoid overflow issues
- The old typo `addCandudate` has been fixed to `addCandidate`
- You must manually fill in the deployed contract ABI and address in `frontend/config.js`
