const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const ethDir = path.join(rootDir, "eth");
const dappDir = path.join(rootDir, "voting-dapp");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const map = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map[key] = value;
  }

  return map;
}

function writeEnvFile(filePath, envMap) {
  const lines = [
    `NEXT_PUBLIC_CONTRACT_ADDRESS=${envMap.NEXT_PUBLIC_CONTRACT_ADDRESS || ""}`,
    `NEXT_PUBLIC_ADMIN_ADDRESS=${envMap.NEXT_PUBLIC_ADMIN_ADDRESS || ""}`,
    `NEXT_PUBLIC_CHAIN_ID=${envMap.NEXT_PUBLIC_CHAIN_ID || "1337"}`,
    `NEXT_PUBLIC_RPC_URL=${envMap.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"}`,
  ];

  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  console.log("\n[1/6] Installing smart contract dependencies...");
  run("npm", ["install"], ethDir);

  console.log("\n[2/6] Installing frontend dependencies...");
  run("npm", ["install"], dappDir);

  console.log("\n[3/6] Compiling contract...");
  run("npm", ["run", "compile"], ethDir);

  console.log("\n[4/6] Deploying contract to local chain...");
  run("npm", ["run", "deploy:local"], ethDir);

  const contractInfoPath = path.join(ethDir, "contractInfo.json");
  const artifactPath = path.join(ethDir, "build", "Voting.json");
  const dappAbiPath = path.join(dappDir, "src", "utils", "contractABI.json");
  const envPath = path.join(dappDir, ".env.local");

  if (!fs.existsSync(contractInfoPath)) {
    throw new Error("Missing eth/contractInfo.json after deployment.");
  }

  if (!fs.existsSync(artifactPath)) {
    throw new Error("Missing eth/build/Voting.json after compile.");
  }

  const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const existingEnv = parseEnvFile(envPath);

  console.log("\n[5/6] Syncing ABI to frontend...");
  fs.writeFileSync(dappAbiPath, `${JSON.stringify(artifact.abi, null, 2)}\n`, "utf8");

  console.log("\n[6/6] Updating frontend .env.local...");
  const nextEnv = {
    ...existingEnv,
    NEXT_PUBLIC_CONTRACT_ADDRESS: contractInfo.address || existingEnv.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ADMIN_ADDRESS:
      contractInfo.adminAddress ||
      existingEnv.NEXT_PUBLIC_ADMIN_ADDRESS ||
      "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    NEXT_PUBLIC_CHAIN_ID: "1337",
    NEXT_PUBLIC_RPC_URL: contractInfo.network || "http://127.0.0.1:8545",
  };

  writeEnvFile(envPath, nextEnv);

  console.log("\nSetup complete.");
  console.log("Next steps:");
  console.log("1) Keep Ganache running at http://127.0.0.1:8545 (chainId 1337)");
  console.log("2) Run frontend: cd voting-dapp && npm run dev");
}

try {
  main();
} catch (error) {
  console.error("\nSetup failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
