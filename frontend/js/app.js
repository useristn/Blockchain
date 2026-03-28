const { ethers } = window;

const POLL_INTERVAL_MS = 5000;

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
  endElectionButton: document.getElementById("endElectionButton"),
  electionStatusBadge: document.getElementById("electionStatusBadge"),
};

const appState = {
  provider: null,
  signer: null,
  contract: null,
  readOnlyContract: null,
  account: null,
  isOwner: false,
  isWhitelisted: false,
  hasVoted: false,
  electionEnded: false,
  pollHandle: null,
};

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

async function ensureProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is required in the browser.");
  }

  if (!appState.provider) {
    appState.provider = new ethers.BrowserProvider(window.ethereum);
  }

  return appState.provider;
}

async function createContracts() {
  if (!hasDeployment()) {
    appState.contract = null;
    appState.readOnlyContract = null;
    return;
  }

  const provider = await ensureProvider();
  appState.readOnlyContract = new ethers.Contract(
    window.CONTRACT_CONFIG.contractAddress,
    window.CONTRACT_CONFIG.abi,
    provider
  );

  if (appState.account) {
    appState.signer = await provider.getSigner();
    appState.contract = new ethers.Contract(
      window.CONTRACT_CONFIG.contractAddress,
      window.CONTRACT_CONFIG.abi,
      appState.signer
    );
  }
}

async function updateConnectionState() {
  dom.accountValue.textContent = shortenAddress(appState.account);

  if (!window.ethereum) {
    dom.networkValue.textContent = "MetaMask missing";
    dom.eligibilityValue.textContent = "Install MetaMask";
    return;
  }

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  const isCorrectNetwork = chainId.toLowerCase() === getTargetChainIdHex().toLowerCase();
  dom.networkValue.textContent = isCorrectNetwork ? `Hardhat (${parseInt(chainId, 16)})` : `Wrong network (${parseInt(chainId, 16)})`;

  if (!appState.account) {
    dom.eligibilityValue.textContent = "Read only";
    return;
  }

  if (appState.isOwner) {
    dom.eligibilityValue.textContent = appState.electionEnded ? "Owner · Closed" : "Owner · Admin access";
    return;
  }

  if (appState.hasVoted) {
    dom.eligibilityValue.textContent = "Vote already used";
    return;
  }

  dom.eligibilityValue.textContent = appState.isWhitelisted ? "Whitelisted voter" : "Not whitelisted";
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
      const disabled = !appState.contract || !appState.isWhitelisted || appState.hasVoted || appState.electionEnded;

      return `
        <div class="col-md-6 col-xl-4">
          <article class="candidate-card">
            <div class="d-flex justify-content-between align-items-center">
              <span class="candidate-rank">${candidate.id + 1}</span>
              <span class="badge text-bg-light">Candidate #${candidate.id}</span>
            </div>
            <div>
              <h3 class="h4 mb-2">${candidate.name}</h3>
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
              ${appState.electionEnded ? "Election closed" : "Vote for this candidate"}
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

async function loadCandidates() {
  if (!hasDeployment()) {
    renderCandidates([]);
    setStatus("Contract is not deployed yet. Run npm run deploy:localhost after starting the Hardhat node.", "warning");
    return;
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

  appState.electionEnded = await contract.electionEnded();
  dom.electionStatusBadge.className = `badge ${appState.electionEnded ? "text-bg-danger" : "text-bg-success"}`;
  dom.electionStatusBadge.textContent = appState.electionEnded ? "Election closed" : "Election active";
  renderCandidates(candidates);
}

async function refreshAccessState() {
  if (!appState.account || !appState.readOnlyContract) {
    appState.isOwner = false;
    appState.isWhitelisted = false;
    appState.hasVoted = false;
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
  try {
    await loadCandidates();
    await refreshAccessState();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Unable to load data from the contract.", "danger");
  }
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
    if (!appState.contract) {
      throw new Error("Connect a wallet before sending transactions.");
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
    const name = dom.candidateName.value.trim();
    if (!name) {
      throw new Error("Candidate name is required.");
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
    const voterAddress = dom.voterAddress.value.trim();
    if (!ethers.isAddress(voterAddress)) {
      throw new Error("Enter a valid wallet address.");
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

async function endElection() {
  try {
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
    await syncUi();
  });

  window.ethereum.on("chainChanged", async () => {
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
  dom.endElectionButton.addEventListener("click", endElection);

  registerProviderListeners();
  startPolling();
  await syncUi();
}

bootstrap();
