const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

function ensureEnvLocal() {
  const votingAppDir = path.join(__dirname, "..", "voting-dapp");
  const envLocalPath = path.join(votingAppDir, ".env.local");
  const envExamplePath = path.join(votingAppDir, ".env.example");

  if (fs.existsSync(envLocalPath)) {
    console.log("`.env.local` already exists – skipping copy.");
    return;
  }

  if (!fs.existsSync(envExamplePath)) {
    console.warn(
      "WARNING: `voting-dapp/.env.example` not found. Skipping env copy."
    );
    return;
  }

  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log("Created `voting-dapp/.env.local` from `.env.example`.");
}

function main() {
  console.log("=== Initial project setup ===");

  // Install in eth/
  run("cd eth && npm install");

  // Install in voting-dapp/
  run("cd voting-dapp && npm install");

  // Create .env.local if missing
  ensureEnvLocal();

  console.log("\nSetup complete.");
  console.log(
    "Next steps:\n" +
      "1) Make sure Ganache is running at http://127.0.0.1:8545 (chainId = 1337)\n" +
      "2) Run: npm run dev"
  );
}

main();
