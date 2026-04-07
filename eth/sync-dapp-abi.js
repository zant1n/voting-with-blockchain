const path = require("path");
const fs = require("fs-extra");

function loadAbi() {
  const contractInfoPath = path.resolve(__dirname, "contractInfo.json");
  if (fs.existsSync(contractInfoPath)) {
    const info = fs.readJsonSync(contractInfoPath);
    if (info && Array.isArray(info.abi)) {
      return info.abi;
    }
  }

  const buildPath = path.resolve(__dirname, "build", "Voting.json");
  if (fs.existsSync(buildPath)) {
    const artifact = fs.readJsonSync(buildPath);
    if (artifact && Array.isArray(artifact.abi)) {
      return artifact.abi;
    }
  }

  throw new Error("Could not find ABI in eth/contractInfo.json or eth/build/Voting.json");
}

function main() {
  const abi = loadAbi();
  const outPath = path.resolve(__dirname, "..", "voting-dapp", "src", "utils", "contractABI.json");
  fs.ensureDirSync(path.dirname(outPath));
  fs.writeJsonSync(outPath, abi, { spaces: 2 });
  console.log(`Synced ABI -> ${outPath}`);
}

main();

