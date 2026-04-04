const path = require('path');
const fs = require('fs-extra');
const { ethers } = require('ethers');

async function main() {
  const buildPath = path.resolve(__dirname, 'build', 'Voting.json');
  const artifact = fs.readJsonSync(buildPath);

  const abi = artifact.abi;
  const bytecode = artifact.evm.bytecode.object.startsWith('0x')
    ? artifact.evm.bytecode.object
    : `0x${artifact.evm.bytecode.object}`;

  const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:8545';
  const candidateEnv = process.env.INIT_CANDIDATES;
  const initialCandidates = parseCandidateInput(candidateEnv);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = await provider.getSigner(0);

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(initialCandidates, {
    gasLimit: 12_000_000
  });
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  const output = {
    network: rpcUrl,
    address,
    abi,
    initialCandidates,
    deployedAt: new Date().toISOString()
  };

  fs.writeJsonSync(path.resolve(__dirname, 'contractInfo.json'), output, { spaces: 2 });

  console.log('Contract deployed successfully');
  console.log(`Address: ${address}`);
  console.log(`Candidates: ${initialCandidates.join(', ')}`);
  console.log('Saved: eth/contractInfo.json');
}

function parseCandidateInput(raw) {
  if (!raw || !raw.trim()) {
    return ['admin', 'demouser1', 'demouser2'];
  }

  const trimmed = raw.trim();

  // Accept JSON-style array input, e.g. ["admin","demouser1","demouser2"]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // Fallback to CSV parser below.
    }
  }

  // Fallback: comma-separated names, with or without quotes/brackets.
  return trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((name) => name.replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
