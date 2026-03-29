const { ethers } = window;

const POLL_INTERVAL_MS = 5000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MAX_CANDIDATE_NAME_LENGTH = 64;

const dom = {
  connectWalletButton: document.getElementById("connectWalletButton"),
  switchNetworkButton: document.getElementById("switchNetworkButton"),
  accountValue: document.getElementById("accountValue"),
  networkValue: document.getElementById("networkValue"),
  eligibilityValue: document.getElementById("eligibilityValue"),
  statusBanner: document.getElementById("statusBanner"),
  candidateGrid: document.getElementById("candidateGrid"),
  adminPanel: document.getElementById("adminPanel"),
  candidateForm: document.getElementById("candidateForm"),
  candidateName: document.getElementById("candidateName"),
  whitelistForm: document.getElementById("whitelistForm"),
  voterAddress: document.getElementById("voterAddress"),
  startElectionButton: document.getElementById("startElectionButton"),
  endElectionButton: document.getElementById("endElectionButton"),
  electionStatusBadge: document.getElementById("electionStatusBadge"),
};

const appState = {
  provider: null,
  readOnlyProvider: null,
  signer: null,
  contract: null,
  readOnlyContract: null,
  account: null,
  isCorrectNetwork: false,
  isOwner: false,
  isWhitelisted: false,
  hasVoted: false,
  electionStarted: false,
  electionEnded: false,
  snapshotVoterCount: 0,
  pollHandle: null,
  isSyncing: false,
  hasPendingSync: false,
  lastCandidateRenderKey: "",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hasDeployment() {
  return Boolean(window.CONTRACT_CONFIG && window.CONTRACT_CONFIG.contractAddress);
}

function shortenAddress(address) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setStatus(message, tone = "secondary") {
  dom.statusBanner.className = `alert alert-${tone} status-banner`;
  dom.statusBanner.textContent = message;
}

function getTargetChainIdHex() {
  return `0x${Number(window.CONTRACT_CONFIG?.chainId || 31337).toString(16)}`;
}

async function getCurrentChainId() {
  if (!window.ethereum) {
    return null;
  }

  return window.ethereum.request({ method: "eth_chainId" });
}

async function ensureOnConfiguredNetwork() {
  const chainId = await getCurrentChainId();
  if (!chainId) {
    throw new Error("MetaMask is required in the browser.");
  }

  if (chainId.toLowerCase() !== getTargetChainIdHex().toLowerCase()) {
    throw new Error("Wrong network. Please switch to Hardhat before sending transactions.");
  }
}

async function ensureProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is required in the browser.");
  }

  if (!appState.provider) {
    appState.provider = new ethers.BrowserProvider(window.ethereum);
  }

  return appState.provider;
}

function ensureReadOnlyProvider() {
  if (!hasDeployment()) {
    throw new Error("Contract is not deployed yet.");
  }

  if (!appState.readOnlyProvider) {
    appState.readOnlyProvider = new ethers.JsonRpcProvider(
      window.CONTRACT_CONFIG.rpcUrl || "http://127.0.0.1:8545"
    );
  }

  return appState.readOnlyProvider;
}

async function createContracts() {
  if (!hasDeployment()) {
    appState.contract = null;
    appState.readOnlyContract = null;
    return;
  }

  if (!appState.readOnlyContract) {
    const readOnlyProvider = ensureReadOnlyProvider();
    appState.readOnlyContract = new ethers.Contract(
      window.CONTRACT_CONFIG.contractAddress,
      window.CONTRACT_CONFIG.abi,
      readOnlyProvider
    );
  }

  if (appState.account && window.ethereum) {
    if (!appState.contract) {
      const provider = await ensureProvider();
      appState.signer = await provider.getSigner();
      appState.contract = new ethers.Contract(
        window.CONTRACT_CONFIG.contractAddress,
        window.CONTRACT_CONFIG.abi,
        appState.signer
      );
    }
    return;
  }

  appState.signer = null;
  appState.contract = null;
}

async function updateConnectionState() {
  dom.accountValue.textContent = shortenAddress(appState.account);

  if (!window.ethereum) {
    dom.networkValue.textContent = "MetaMask missing";
    dom.eligibilityValue.textContent = "Install MetaMask";
    appState.isCorrectNetwork = false;
    return;
  }

  const chainId = await getCurrentChainId();
  const isCorrectNetwork = chainId.toLowerCase() === getTargetChainIdHex().toLowerCase();
  appState.isCorrectNetwork = isCorrectNetwork;
  dom.networkValue.textContent = isCorrectNetwork
    ? `Hardhat (${parseInt(chainId, 16)})`
    : `Wrong network (${parseInt(chainId, 16)})`;

  if (!appState.account) {
    dom.eligibilityValue.textContent = "Read only";
    return;
  }

  if (appState.isOwner) {
    if (!appState.electionStarted) {
      dom.eligibilityValue.textContent = "Owner · Ready to start";
      return;
    }

    dom.eligibilityValue.textContent = appState.electionEnded ? "Owner · Closed" : "Owner · Admin access";
    return;
  }

  if (!appState.electionStarted) {
    dom.eligibilityValue.textContent = "Waiting for election start";
    return;
  }

  if (appState.hasVoted) {
    dom.eligibilityValue.textContent = "Vote already used";
    return;
  }

  dom.eligibilityValue.textContent = appState.isWhitelisted ? "Whitelisted voter" : "Not whitelisted";
}

function buildReadyStatus() {
  if (!hasDeployment()) {
    return {
      message: "Contract is not deployed yet. Run npm run deploy:localhost after starting the Hardhat node.",
      tone: "warning",
    };
  }

  if (!window.ethereum) {
    return {
      message: "Read-only mode is active. Install or unlock MetaMask to send transactions.",
      tone: "secondary",
    };
  }

  if (!appState.account) {
    return {
      message: "Contract synced. Connect a wallet to interact with the election.",
      tone: "secondary",
    };
  }

  if (!appState.isCorrectNetwork) {
    return {
      message: "Connected wallet is on the wrong network. Switch MetaMask to Hardhat Localhost.",
      tone: "warning",
    };
  }

  if (appState.isOwner) {
    if (!appState.electionStarted) {
      return {
        message: "Owner connected. Whitelist voters or start the election.",
        tone: "info",
      };
    }

    if (appState.electionEnded) {
      return {
        message: "Owner connected. Election is closed.",
        tone: "secondary",
      };
    }

    return {
      message: "Owner connected. Election is active.",
      tone: "info",
    };
  }

  if (!appState.electionStarted) {
    return {
      message: "Wallet connected. Waiting for the owner to start the election.",
      tone: "secondary",
    };
  }

  if (appState.electionEnded) {
    return {
      message: "Election is closed. Voting is disabled.",
      tone: "secondary",
    };
  }

  if (appState.hasVoted) {
    return {
      message: "This wallet has already voted.",
      tone: "secondary",
    };
  }

  if (appState.isWhitelisted) {
    return {
      message: "Wallet connected. This account is ready to vote.",
      tone: "success",
    };
  }

  return {
    message: "Wallet connected, but this account is not whitelisted for the current election.",
    tone: "warning",
  };
}

function renderCandidates(candidates) {
  if (!candidates.length) {
    dom.candidateGrid.innerHTML = `
      <div class="col-12">
        <div class="candidate-card">
          <h3 class="h5 mb-2">No candidates deployed yet</h3>
          <p class="mb-0 text-muted">Run the deploy script to seed the contract and sync frontend configuration.</p>
        </div>
      </div>
    `;
    return;
  }

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  dom.candidateGrid.innerHTML = candidates
    .map((candidate) => {
      const percentage = totalVotes === 0 ? 0 : Math.round((candidate.voteCount / totalVotes) * 100);
      const disabled =
        !appState.contract ||
        !appState.electionStarted ||
        !appState.isWhitelisted ||
        appState.hasVoted ||
        appState.electionEnded;

      return `
        <div class="col-md-6 col-xl-4">
          <article class="candidate-card">
            <div class="d-flex justify-content-between align-items-center">
              <span class="candidate-rank">${candidate.id + 1}</span>
              <span class="badge text-bg-light">Candidate #${candidate.id}</span>
            </div>
            <div>
              <h3 class="h4 mb-2">${escapeHtml(candidate.name)}</h3>
              <p class="progress-label mb-0">One wallet can cast exactly one vote.</p>
            </div>
            <div>
              <div class="vote-count">${candidate.voteCount}</div>
              <div class="progress mt-3" role="progressbar" aria-label="Vote share" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: ${percentage}%"></div>
              </div>
              <div class="progress-label mt-2">${percentage}% of current tally</div>
            </div>
            <button class="btn btn-primary btn-vote mt-auto" data-candidate-id="${candidate.id}" ${disabled ? "disabled" : ""}>
              ${appState.electionEnded ? "Election closed" : appState.electionStarted ? "Vote for this candidate" : "Not started"}
            </button>
          </article>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".btn-vote").forEach((button) => {
    button.addEventListener("click", async () => {
      const candidateId = Number(button.dataset.candidateId);
      await submitVote(candidateId);
    });
  });
}

function buildCandidateRenderKey(candidates) {
  return JSON.stringify({
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      voteCount: candidate.voteCount,
    })),
    canVote: Boolean(appState.contract),
    electionStarted: appState.electionStarted,
    electionEnded: appState.electionEnded,
    isWhitelisted: appState.isWhitelisted,
    hasVoted: appState.hasVoted,
  });
}

function renderCandidatesIfChanged(candidates) {
  const renderKey = buildCandidateRenderKey(candidates);
  if (renderKey === appState.lastCandidateRenderKey) {
    return;
  }

  appState.lastCandidateRenderKey = renderKey;
  renderCandidates(candidates);
}

async function loadCandidates() {
  if (!hasDeployment()) {
    appState.lastCandidateRenderKey = "";
    renderCandidates([]);
    setStatus("Contract is not deployed yet. Run npm run deploy:localhost after starting the Hardhat node.", "warning");
    return [];
  }

  await createContracts();
  const contract = appState.readOnlyContract;
  const candidateCount = Number(await contract.getCandidatesCount());
  const candidates = await Promise.all(
    Array.from({ length: candidateCount }, async (_, index) => {
      const [name, voteCount] = await contract.getCandidate(index);
      return {
        id: index,
        name,
        voteCount: Number(voteCount),
      };
    })
  );

  const summary = await contract.getElectionSummary();
  appState.electionStarted = summary.started;
  appState.electionEnded = summary.ended;
  appState.snapshotVoterCount = Number(summary.votersAtSnapshot);

  if (appState.electionEnded) {
    dom.electionStatusBadge.className = "badge text-bg-danger";
    dom.electionStatusBadge.textContent = "Election closed";
  } else if (appState.electionStarted) {
    dom.electionStatusBadge.className = "badge text-bg-success";
    dom.electionStatusBadge.textContent = `Election active · Snapshot ${appState.snapshotVoterCount}`;
  } else {
    dom.electionStatusBadge.className = "badge text-bg-secondary";
    dom.electionStatusBadge.textContent = "Preparation phase";
  }

  dom.startElectionButton.disabled = appState.electionStarted && !appState.electionEnded;
  dom.endElectionButton.disabled = !appState.electionStarted || appState.electionEnded;
  return candidates;
}

async function refreshAccessState() {
  if (!appState.account || !appState.readOnlyContract) {
    appState.isOwner = false;
    appState.isWhitelisted = false;
    appState.hasVoted = false;
    dom.adminPanel.classList.add("d-none");
    await updateConnectionState();
    return;
  }

  const [ownerAddress, whitelisted, voted] = await Promise.all([
    appState.readOnlyContract.owner(),
    appState.readOnlyContract.whitelist(appState.account),
    appState.readOnlyContract.hasVoted(appState.account),
  ]);

  appState.isOwner = ownerAddress.toLowerCase() === appState.account.toLowerCase();
  appState.isWhitelisted = whitelisted;
  appState.hasVoted = voted;
  dom.adminPanel.classList.toggle("d-none", !appState.isOwner);
  await updateConnectionState();
}

async function syncUi() {
  if (appState.isSyncing) {
    appState.hasPendingSync = true;
    return;
  }

  appState.isSyncing = true;

  try {
    const candidates = await loadCandidates();
    await refreshAccessState();
    renderCandidatesIfChanged(candidates);
    const readyStatus = buildReadyStatus();
    setStatus(readyStatus.message, readyStatus.tone);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Unable to load data from the contract.", "danger");
  } finally {
    appState.isSyncing = false;
    if (appState.hasPendingSync) {
      appState.hasPendingSync = false;
      await syncUi();
    }
  }
}

async function ensureReadyForWrite() {
  if (!appState.account || !appState.contract) {
    throw new Error("Connect your wallet before sending transactions.");
  }

  await ensureOnConfiguredNetwork();
}

async function connectWallet() {
  try {
    await ensureProvider();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    appState.account = accounts[0] || null;
    setStatus("Wallet connected. Loading contract state...", "info");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Wallet connection failed.", "danger");
  }
}

async function switchNetwork() {
  try {
    await ensureProvider();
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: getTargetChainIdHex() }],
    });
    setStatus("Switched to Hardhat network.", "success");
    await syncUi();
  } catch (error) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: getTargetChainIdHex(),
              chainName: "Hardhat Localhost",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
        setStatus("Hardhat network added to MetaMask.", "success");
        await syncUi();
        return;
      } catch (addError) {
        console.error(addError);
        setStatus(addError.message || "Failed to add Hardhat network.", "danger");
        return;
      }
    }

    console.error(error);
    setStatus(error.message || "Failed to switch network.", "danger");
  }
}

async function submitVote(candidateId) {
  try {
    await ensureReadyForWrite();

    if (!Number.isInteger(candidateId) || candidateId < 0) {
      throw new Error("Invalid candidate id.");
    }

    setStatus("Submitting vote transaction. Confirm it in MetaMask.", "warning");
    const transaction = await appState.contract.vote(candidateId);
    await transaction.wait();
    setStatus("Vote submitted successfully.", "success");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.shortMessage || error.reason || error.message || "Vote failed.", "danger");
  }
}

async function addCandidate(event) {
  event.preventDefault();

  try {
    await ensureReadyForWrite();

    const name = dom.candidateName.value.trim();
    if (!name) {
      throw new Error("Candidate name is required.");
    }

    if (name.length > MAX_CANDIDATE_NAME_LENGTH) {
      throw new Error(`Candidate name must be <= ${MAX_CANDIDATE_NAME_LENGTH} characters.`);
    }

    setStatus("Creating candidate. Confirm the transaction in MetaMask.", "warning");
    const transaction = await appState.contract.addCandidate(name);
    await transaction.wait();
    dom.candidateName.value = "";
    setStatus("Candidate created successfully.", "success");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.shortMessage || error.reason || error.message || "Unable to add candidate.", "danger");
  }
}

async function whitelistVoter(event) {
  event.preventDefault();

  try {
    await ensureReadyForWrite();

    const voterAddressInput = dom.voterAddress.value.trim();
    if (!ethers.isAddress(voterAddressInput)) {
      throw new Error("Enter a valid wallet address.");
    }

    const voterAddress = ethers.getAddress(voterAddressInput);
    if (voterAddress.toLowerCase() === ZERO_ADDRESS) {
      throw new Error("Zero address is not allowed.");
    }

    setStatus("Whitelisting voter. Confirm the transaction in MetaMask.", "warning");
    const transaction = await appState.contract.whitelistVoter(voterAddress);
    await transaction.wait();
    dom.voterAddress.value = "";
    setStatus("Voter access granted successfully.", "success");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.shortMessage || error.reason || error.message || "Unable to whitelist voter.", "danger");
  }
}

async function startElection() {
  try {
    await ensureReadyForWrite();

    const summary = await appState.readOnlyContract.getElectionSummary();
    if (summary.started && !summary.ended) {
      throw new Error("Election is already active. End current election before starting a new round.");
    }

    setStatus("Starting election and snapshotting voters. Confirm in MetaMask.", "warning");
    const transaction = await appState.contract.startElection();
    await transaction.wait();
    setStatus("Election started. Parameters are now frozen.", "success");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.shortMessage || error.reason || error.message || "Unable to start election.", "danger");
  }
}

async function endElection() {
  try {
    await ensureReadyForWrite();

    setStatus("Closing the election. Confirm the transaction in MetaMask.", "warning");
    const transaction = await appState.contract.endElection();
    await transaction.wait();
    setStatus("Election closed successfully.", "success");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.shortMessage || error.reason || error.message || "Unable to close the election.", "danger");
  }
}

function registerProviderListeners() {
  if (!window.ethereum) {
    return;
  }

  window.ethereum.on("accountsChanged", async (accounts) => {
    appState.account = accounts[0] || null;
    appState.signer = null;
    appState.contract = null;
    await syncUi();
  });

  window.ethereum.on("chainChanged", async () => {
    appState.provider = null;
    appState.signer = null;
    appState.contract = null;
    await syncUi();
  });
}

function startPolling() {
  if (appState.pollHandle) {
    clearInterval(appState.pollHandle);
  }

  appState.pollHandle = window.setInterval(async () => {
    if (hasDeployment()) {
      await syncUi();
    }
  }, POLL_INTERVAL_MS);
}

async function bootstrap() {
  dom.connectWalletButton.addEventListener("click", connectWallet);
  dom.switchNetworkButton.addEventListener("click", switchNetwork);
  dom.candidateForm.addEventListener("submit", addCandidate);
  dom.whitelistForm.addEventListener("submit", whitelistVoter);
  dom.startElectionButton.addEventListener("click", startElection);
  dom.endElectionButton.addEventListener("click", endElection);

  registerProviderListeners();
  startPolling();
  await syncUi();
}

bootstrap();
