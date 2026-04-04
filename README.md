# voting-with-blockchain

## Phase 1 Handoff (Smart Contract)

- Contract Address (Local Ganache): `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- Contract ABI JSON: `voting-dapp/src/utils/contractABI.json`
- Deployment metadata: `eth/contractInfo.json`

### Contract Commands

```bash
cd eth
npm install
npm run compile
npm run deploy:local
```

## Remix + Ganache Deployment Notes

1. Start local Ganache on `127.0.0.1:8545`.
2. Open Remix and load `eth/Contract/voting.sol`.
3. Compile with Solidity compiler `0.8.19` (do not use 0.8.20+).
	- In Advanced Configuration, set EVM Version to `paris` or `london`.
4. In Deploy & Run Transactions:
	- Environment: `Dev - Ganache Provider`
	- Provider URL: `http://127.0.0.1:8545`
	- Constructor argument (`string[]`): `["admin","demouser1","demouser2"]`
5. Deploy and copy:
	- Deployed contract address
	- ABI JSON from Remix compiler output

## Frontend (Next.js + Tailwind)

```bash
cd voting-dapp
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and connect MetaMask.

### Required Env

- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ADMIN_ADDRESS`