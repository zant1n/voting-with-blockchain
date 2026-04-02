let web3Instance = null;
let contractInstance = null;
let currentAccount = "";
let adminAccount = "";

const electionStateNames = ["Setup", "Active", "Closed"];

const elements = {
  connectionStatus: document.getElementById("connectionStatus"),
  currentAccount: document.getElementById("currentAccount"),
  networkStatus: document.getElementById("networkStatus"),
  electionTitle: document.getElementById("electionTitle"),
  electionDescription: document.getElementById("electionDescription"),
  electionStateBadge: document.getElementById("electionStateBadge"),
  totalVotes: document.getElementById("totalVotes"),
  adminAccessBadge: document.getElementById("adminAccessBadge"),
  eligibilityBadge: document.getElementById("eligibilityBadge"),
  eligibilityMessage: document.getElementById("eligibilityMessage"),
  candidatesGrid: document.getElementById("candidatesGrid"),
  resultsGrid: document.getElementById("resultsGrid"),
  messageBar: document.getElementById("messageBar"),
  loadingState: document.getElementById("loadingState"),
  connectWalletBtn: document.getElementById("connectWalletBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  candidateForm: document.getElementById("candidateForm"),
  whitelistForm: document.getElementById("whitelistForm"),
  startElectionBtn: document.getElementById("startElectionBtn"),
  closeElectionBtn: document.getElementById("closeElectionBtn"),
};

function setMessage(message, isError = false) {
  elements.messageBar.textContent = message;
  elements.messageBar.style.color = isError ? "#ffb0ba" : "#aab4d6";
}

function setLoading(isLoading) {
  elements.loadingState.classList.toggle("hidden", !isLoading);
}

function shortAddress(address) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toImageUrl(imgHash) {
  if (!imgHash) {
    return window.DEFAULT_CANDIDATE_IMAGE;
  }

  if (imgHash.startsWith("http://") || imgHash.startsWith("https://")) {
    return imgHash;
  }

  return `https://ipfs.io/ipfs/${imgHash}`;
}

function electionStateLabel(stateValue) {
  return electionStateNames[Number(stateValue)] || "Unknown";
}

async function ensureContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  if (
    !window.APP_CONFIG.contractAddress ||
    !Array.isArray(window.APP_CONFIG.contractAbi) ||
    window.APP_CONFIG.contractAbi.length === 0
  ) {
    throw new Error(
      "Please fill contractAddress and contractAbi in frontend/config.js.",
    );
  }

  if (!web3Instance) {
    web3Instance = new Web3(window.ethereum);
  }

  if (!contractInstance) {
    contractInstance = new web3Instance.eth.Contract(
      window.APP_CONFIG.contractAbi,
      window.APP_CONFIG.contractAddress,
    );
  }
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not found.");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    currentAccount = accounts[0] || "";
    web3Instance = new Web3(window.ethereum);
    contractInstance = new web3Instance.eth.Contract(
      window.APP_CONFIG.contractAbi,
      window.APP_CONFIG.contractAddress,
    );

    elements.connectionStatus.textContent = "Wallet connected";
    elements.currentAccount.textContent = shortAddress(currentAccount);
    setMessage(`Connected as ${currentAccount}`);

    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function refreshDashboard() {
  try {
    await ensureContract();

    const [title, description, stateValue, totalVotesValue, adminValue] =
      await Promise.all([
        contractInstance.methods.electionTitle().call(),
        contractInstance.methods.electionDescription().call(),
        contractInstance.methods.electionState().call(),
        contractInstance.methods.getTotalVotes().call(),
        contractInstance.methods.admin().call(),
      ]);

    adminAccount = adminValue;
    elements.electionTitle.textContent = title || "-";
    elements.electionDescription.textContent = description || "-";
    elements.electionStateBadge.textContent = electionStateLabel(stateValue);
    elements.totalVotes.textContent = totalVotesValue;
    elements.networkStatus.textContent = `Contract: ${window.APP_CONFIG.contractAddress}`;

    const isAdmin =
      currentAccount &&
      adminValue &&
      currentAccount.toLowerCase() === adminValue.toLowerCase();
    elements.adminAccessBadge.textContent = isAdmin
      ? "Admin verified"
      : "Not admin";
    elements.adminAccessBadge.classList.toggle("muted", !isAdmin);

    await renderCandidates();
    await renderEligibility();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function renderEligibility() {
  if (!currentAccount) {
    elements.eligibilityBadge.textContent = "Wallet disconnected";
    elements.eligibilityMessage.textContent =
      "Connect your wallet to check voting eligibility.";
    return;
  }

  const [whitelisted, hasVoted, canVote, stateValue] = await Promise.all([
    contractInstance.methods.whitelistedVoters(currentAccount).call(),
    contractInstance.methods.hasVoted(currentAccount).call(),
    contractInstance.methods.isEligibleToVote(currentAccount).call(),
    contractInstance.methods.electionState().call(),
  ]);

  const stateLabel = electionStateLabel(stateValue);
  if (canVote) {
    elements.eligibilityBadge.textContent = "Eligible";
    elements.eligibilityBadge.classList.remove("muted");
    elements.eligibilityMessage.textContent =
      "Your wallet is eligible to vote right now.";
  } else if (Number(stateValue) === 0) {
    elements.eligibilityBadge.textContent = "Setup";
    elements.eligibilityBadge.classList.add("muted");
    elements.eligibilityMessage.textContent =
      "The election is still in setup state.";
  } else if (Number(stateValue) === 2) {
    elements.eligibilityBadge.textContent = "Closed";
    elements.eligibilityBadge.classList.add("muted");
    elements.eligibilityMessage.textContent = hasVoted
      ? "You already voted in this election."
      : "Voting has ended. Results are visible below.";
  } else if (!whitelisted) {
    elements.eligibilityBadge.textContent = "Not whitelisted";
    elements.eligibilityBadge.classList.add("muted");
    elements.eligibilityMessage.textContent =
      "This wallet is not in the whitelist.";
  } else if (hasVoted) {
    elements.eligibilityBadge.textContent = "Already voted";
    elements.eligibilityBadge.classList.add("muted");
    elements.eligibilityMessage.textContent =
      "You have already cast your vote.";
  } else {
    elements.eligibilityBadge.textContent = stateLabel;
    elements.eligibilityBadge.classList.add("muted");
    elements.eligibilityMessage.textContent = "Voting is not active yet.";
  }
}

async function renderCandidates() {
  const candidateCount = Number(
    await contractInstance.methods.getNumCandidates().call(),
  );
  const cards = [];
  const results = [];

  for (let index = 0; index < candidateCount; index++) {
    const candidate = await contractInstance.methods.getCandidate(index).call();
    const candidateId = Number(candidate[0]);
    const candidateName = candidate[1];
    const manifesto = candidate[2];
    const imgHash = candidate[3];
    const voteCount = Number(candidate[4]);
    const canVote = currentAccount
      ? await contractInstance.methods.isEligibleToVote(currentAccount).call()
      : false;

    cards.push(`
      <article class="card">
        <img src="${toImageUrl(imgHash)}" alt="${candidateName}" />
        <div class="card-body">
          <h3>${candidateName}</h3>
          <p>${manifesto || "No manifesto provided."}</p>
          <div class="card-actions">
            <button class="primary" data-vote-id="${candidateId}" ${canVote ? "" : "disabled"}>Vote</button>
            <span class="badge">${voteCount} votes</span>
          </div>
        </div>
      </article>
    `);

    results.push(`
      <article class="card">
        <img src="${toImageUrl(imgHash)}" alt="${candidateName}" />
        <div class="card-body">
          <h3>${candidateName}</h3>
          <p>${manifesto || "No manifesto provided."}</p>
          <span class="badge">${voteCount} votes</span>
        </div>
      </article>
    `);
  }

  elements.candidatesGrid.innerHTML =
    cards.join("") || "<p>No candidates yet.</p>";
  elements.resultsGrid.innerHTML = results.join("") || "<p>No results yet.</p>";

  elements.candidatesGrid
    .querySelectorAll("button[data-vote-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const candidateId = button.getAttribute("data-vote-id");
        await castVote(candidateId);
      });
    });
}

async function castVote(candidateId) {
  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first.");
    }

    setLoading(true);
    setMessage("Submitting vote transaction...");
    await contractInstance.methods
      .vote(candidateId)
      .send({ from: currentAccount });
    setMessage("Vote confirmed successfully.");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

async function addCandidate(event) {
  event.preventDefault();

  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first.");
    }

    const admin = await contractInstance.methods.admin().call();
    if (currentAccount.toLowerCase() !== admin.toLowerCase()) {
      throw new Error("Only the admin wallet can add candidates.");
    }

    const name = document.getElementById("candidateName").value.trim();
    const manifesto = document
      .getElementById("candidateManifesto")
      .value.trim();
    const imgHash = document.getElementById("candidateImgHash").value.trim();

    if (!name) {
      throw new Error("Candidate name is required.");
    }

    setLoading(true);
    await contractInstance.methods
      .addCandidate(name, manifesto, imgHash)
      .send({ from: currentAccount });
    event.target.reset();
    setMessage("Candidate added.");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

async function whitelistVoter(event) {
  event.preventDefault();

  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first.");
    }

    const admin = await contractInstance.methods.admin().call();
    if (currentAccount.toLowerCase() !== admin.toLowerCase()) {
      throw new Error("Only the admin wallet can whitelist voters.");
    }

    const voterAddress = document.getElementById("voterAddress").value.trim();
    if (!web3Instance.utils.isAddress(voterAddress)) {
      throw new Error("Please enter a valid wallet address.");
    }

    setLoading(true);
    await contractInstance.methods
      .addVoterToWhitelist(voterAddress)
      .send({ from: currentAccount });
    event.target.reset();
    setMessage("Voter added to whitelist.");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

async function startElection() {
  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first.");
    }

    const admin = await contractInstance.methods.admin().call();
    if (currentAccount.toLowerCase() !== admin.toLowerCase()) {
      throw new Error("Only the admin wallet can start the election.");
    }

    setLoading(true);
    await contractInstance.methods
      .startElection()
      .send({ from: currentAccount });
    setMessage("Election started.");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

async function closeElection() {
  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first.");
    }

    const admin = await contractInstance.methods.admin().call();
    if (currentAccount.toLowerCase() !== admin.toLowerCase()) {
      throw new Error("Only the admin wallet can end the election.");
    }

    setLoading(true);
    await contractInstance.methods
      .closeElection()
      .send({ from: currentAccount });
    setMessage("Election closed.");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

function wireEvents() {
  elements.connectWalletBtn.addEventListener("click", connectWallet);
  elements.refreshBtn.addEventListener("click", refreshDashboard);
  elements.candidateForm.addEventListener("submit", addCandidate);
  elements.whitelistForm.addEventListener("submit", whitelistVoter);
  elements.startElectionBtn.addEventListener("click", startElection);
  elements.closeElectionBtn.addEventListener("click", closeElection);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
      currentAccount = accounts[0] || "";
      elements.currentAccount.textContent = shortAddress(currentAccount);
      await refreshDashboard();
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

async function bootstrap() {
  wireEvents();

  if (!window.ethereum) {
    setMessage("MetaMask is required to use this app.", true);
    return;
  }

  if (
    !window.APP_CONFIG.contractAddress ||
    !Array.isArray(window.APP_CONFIG.contractAbi) ||
    window.APP_CONFIG.contractAbi.length === 0
  ) {
    setMessage(
      "Fill the contract address and ABI in frontend/config.js before using the app.",
      true,
    );
    return;
  }

  elements.networkStatus.textContent = "Ready to connect";
}

bootstrap();
