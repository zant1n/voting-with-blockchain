const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true, ...options });
}

function readContractAddress() {
  const infoPath = path.join(__dirname, "..", "eth", "contractInfo.json");
  if (!fs.existsSync(infoPath)) {
    throw new Error("eth/contractInfo.json not found. Did deploy:local run?");
  }

  const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  if (!info.address) {
    throw new Error("No `address` in eth/contractInfo.json");
  }

  return info.address;
}

function updateEnv(key, value) {
  const votingAppDir = path.join(__dirname, "..", "voting-dapp");
  const envPath = path.join(votingAppDir, ".env.local");
  const envExamplePath = path.join(votingAppDir, ".env.example");

  let envContent;
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
  } else {
    envContent = "";
  }

  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    if (envContent.length && !envContent.endsWith("\n")) envContent += "\n";
    envContent += line + "\n";
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log(`Updated ${key} in voting-dapp/.env.local`);
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  console.log("=== Compile & Deploy & Start DApp ===");

  console.log(
    "Make sure Ganache is running on http://127.0.0.1:8545 (chainId = 1337)."
  );

  // Compile + deploy contract
  run("cd eth && npm run compile");
  run("cd eth && npm run deploy:local");

  // Read deployed address
  const contractAddress = readContractAddress();
  console.log(`Deployed contract address: ${contractAddress}`);

  // Ask for admin (Ganache) address
  const adminAddress = await ask(
    "Enter Ganache admin address (0x... from Ganache UI): "
  );

  // Update env variables
  updateEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", contractAddress);
  updateEnv("NEXT_PUBLIC_ADMIN_ADDRESS", adminAddress || "");
  updateEnv("NEXT_PUBLIC_CHAIN_ID", "1337");
  updateEnv("NEXT_PUBLIC_RPC_URL", "http://127.0.0.1:8545");

  console.log("\nEnvironment updated. Starting Next.js dev server...\n");

  // Start `npm run dev` in voting-dapp
  const votingAppDir = path.join(__dirname, "..", "voting-dapp");
  const child = spawn("npm", ["run", "dev"], {
    cwd: votingAppDir,
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    console.log(`voting-dapp dev server exited with code ${code}`);
  });
}

main().catch((err) => {
  console.error("Error in dev script:", err.message);
  process.exit(1);
});