const { ethers } = window;

const POLL_INTERVAL_MS = 5000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MAX_CANDIDATE_NAME_LENGTH = 64;

const ACTION_LABELS = {
  1: "Candidate Added",
  2: "Voter Whitelisted",
  3: "Election Started",
  4: "Vote Cast",
  5: "Election Ended",
  6: "Round Reset",
};

const dom = {
  connectWalletButton: document.getElementById("connectWalletButton"),
  switchNetworkButton: document.getElementById("switchNetworkButton"),
  accountValue: document.getElementById("accountValue"),
  networkValue: document.getElementById("networkValue"),
  eligibilityValue: document.getElementById("eligibilityValue"),
  turnoutValue: document.getElementById("turnoutValue"),
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
  roundBadge: document.getElementById("roundBadge"),
  statsPanel: document.getElementById("statsPanel"),
  statTotalVotes: document.getElementById("statTotalVotes"),
  statCandidates: document.getElementById("statCandidates"),
  statSnapshot: document.getElementById("statSnapshot"),
  statAudit: document.getElementById("statAudit"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerDetail: document.getElementById("winnerDetail"),
  auditPanel: document.getElementById("auditPanel"),
  toggleAuditButton: document.getElementById("toggleAuditButton"),
  auditBody: document.getElementById("auditBody"),
  auditTableBody: document.getElementById("auditTableBody"),
  toastContainer: document.getElementById("toastContainer"),
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
  electionRound: 0,
  snapshotVoterCount: 0,
  totalVotesCast: 0,
  candidateCount: 0,
  auditRecordCount: 0,
  pollHandle: null,
  isSyncing: false,
  hasPendingSync: false,
  lastCandidateRenderKey: "",
  auditOpen: false,
};

/* ── Helpers ── */

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
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setStatus(message, tone = "secondary") {
  const iconMap = {
    secondary: "bi-info-circle",
    info: "bi-lightbulb",
    success: "bi-check-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    danger: "bi-x-octagon-fill",
  };
  dom.statusBanner.className = `alert alert-${tone} status-banner`;
  dom.statusBanner.innerHTML = `<i class="bi ${iconMap[tone] || iconMap.secondary} me-2"></i><span>${escapeHtml(message)}</span>`;
}

function showToast(message, type = "info") {
  const iconMap = {
    success: "bi-check-circle-fill",
    danger: "bi-x-octagon-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  const id = `toast-${Date.now()}`;
  const html = `
    <div id="${id}" class="toast toast-custom" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
      <div class="toast-header">
        <i class="bi ${iconMap[type] || iconMap.info} me-2" style="color:var(--${type === "success" ? "success" : type === "danger" ? "danger" : type === "warning" ? "accent" : "info"})"></i>
        <strong class="me-auto">${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    </div>
  `;
  dom.toastContainer.insertAdjacentHTML("beforeend", html);
  const toastEl = document.getElementById(id);
  // Bootstrap Toast requires bootstrap JS – use manual fade instead
  toastEl.style.opacity = "0";
  toastEl.style.transition = "opacity 0.3s ease";
  requestAnimationFrame(() => { toastEl.style.opacity = "1"; });

  const closeBtn = toastEl.querySelector(".btn-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      toastEl.style.opacity = "0";
      setTimeout(() => toastEl.remove(), 350);
    });
  }

  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.style.opacity = "0";
      setTimeout(() => toastEl.remove(), 350);
    }
  }, 4000);
}

let spinnerEl = null;
function showSpinner() {
  if (spinnerEl) return;
  spinnerEl = document.createElement("div");
  spinnerEl.className = "spinner-overlay";
  spinnerEl.innerHTML = '<div class="spinner-ring"></div>';
  document.body.appendChild(spinnerEl);
}

function hideSpinner() {
  if (spinnerEl) {
    spinnerEl.remove();
    spinnerEl = null;
  }
}

function getTargetChainIdHex() {
  return `0x${Number(window.CONTRACT_CONFIG?.chainId || 31337).toString(16)}`;
}

async function getCurrentChainId() {
  if (!window.ethereum) return null;
  return window.ethereum.request({ method: "eth_chainId" });
}

async function ensureOnConfiguredNetwork() {
  const chainId = await getCurrentChainId();
  if (!chainId) throw new Error("MetaMask is required in the browser.");
  if (chainId.toLowerCase() !== getTargetChainIdHex().toLowerCase()) {
    throw new Error("Wrong network. Please switch to Hardhat before sending transactions.");
  }
}

async function ensureProvider() {
  if (!window.ethereum) throw new Error("MetaMask is required in the browser.");
  if (!appState.provider) {
    appState.provider = new ethers.BrowserProvider(window.ethereum);
  }
  return appState.provider;
}

function ensureReadOnlyProvider() {
  if (!hasDeployment()) throw new Error("Contract is not deployed yet.");
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

/* ── UI State ── */

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
    : `Wrong (${parseInt(chainId, 16)})`;

  if (!appState.account) {
    dom.eligibilityValue.textContent = "Read only";
    return;
  }

  if (appState.isOwner) {
    if (!appState.electionStarted) {
      dom.eligibilityValue.textContent = "Owner · Setup";
      return;
    }
    dom.eligibilityValue.textContent = appState.electionEnded ? "Owner · Closed" : "Owner · Active";
    return;
  }

  if (!appState.electionStarted) {
    dom.eligibilityValue.textContent = "Waiting";
    return;
  }

  if (appState.hasVoted) {
    dom.eligibilityValue.textContent = "Voted \u2713";
    return;
  }

  dom.eligibilityValue.textContent = appState.isWhitelisted ? "Ready to vote" : "Not whitelisted";
}

function updateTurnout() {
  if (appState.snapshotVoterCount > 0) {
    const pct = Math.round((appState.totalVotesCast / appState.snapshotVoterCount) * 100);
    dom.turnoutValue.textContent = `${appState.totalVotesCast}/${appState.snapshotVoterCount} (${pct}%)`;
  } else {
    dom.turnoutValue.textContent = "\u2014";
  }
}

function updateStats() {
  dom.statTotalVotes.textContent = appState.totalVotesCast;
  dom.statCandidates.textContent = appState.candidateCount;
  dom.statSnapshot.textContent = appState.snapshotVoterCount;
  dom.statAudit.textContent = appState.auditRecordCount;
  dom.statsPanel.classList.toggle("d-none", !hasDeployment());
}

function updateRoundBadge() {
  dom.roundBadge.textContent = appState.electionRound > 0 ? `Round ${appState.electionRound}` : "Round \u2014";
}

function buildReadyStatus() {
  if (!hasDeployment()) {
    return { message: "Contract not deployed. Run npm run deploy:localhost after starting Hardhat node.", tone: "warning" };
  }
  if (!window.ethereum) {
    return { message: "Read-only mode. Install or unlock MetaMask to send transactions.", tone: "secondary" };
  }
  if (!appState.account) {
    return { message: "Contract synced. Connect a wallet to interact with the election.", tone: "secondary" };
  }
  if (!appState.isCorrectNetwork) {
    return { message: "Wrong network detected. Switch MetaMask to Hardhat Localhost.", tone: "warning" };
  }
  if (appState.isOwner) {
    if (!appState.electionStarted) return { message: "Owner connected. Add candidates, whitelist voters, or start election.", tone: "info" };
    if (appState.electionEnded) return { message: "Election closed. You can start a new round.", tone: "secondary" };
    return { message: "Election active. Monitoring votes in real time.", tone: "info" };
  }
  if (!appState.electionStarted) return { message: "Waiting for the owner to start the election.", tone: "secondary" };
  if (appState.electionEnded) return { message: "Election closed. Final results are shown below.", tone: "secondary" };
  if (appState.hasVoted) return { message: "Your vote has been recorded on-chain.", tone: "secondary" };
  if (appState.isWhitelisted) return { message: "You are eligible to vote. Choose a candidate below.", tone: "success" };
  return { message: "Wallet connected but not whitelisted for this election.", tone: "warning" };
}

/* ── Render candidates ── */

function renderCandidates(candidates) {
  if (!candidates.length) {
    dom.candidateGrid.innerHTML = `
      <div class="col-12">
        <div class="candidate-card" style="text-align:center;padding:2.5rem">
          <i class="bi bi-inbox" style="font-size:2.5rem;color:var(--text-muted);opacity:0.5"></i>
          <h3 class="h5 mb-2 mt-3">No candidates yet</h3>
          <p class="mb-0 text-muted">Deploy the contract and add candidates to get started.</p>
        </div>
      </div>
    `;
    return;
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const maxVotes = Math.max(...candidates.map((c) => c.voteCount));
  const hasVotes = totalVotes > 0;

  dom.candidateGrid.innerHTML = candidates
    .map((candidate) => {
      const percentage = totalVotes === 0 ? 0 : Math.round((candidate.voteCount / totalVotes) * 100);
      const isLeader = hasVotes && candidate.voteCount === maxVotes;
      const disabled =
        !appState.contract ||
        !appState.electionStarted ||
        !appState.isWhitelisted ||
        appState.hasVoted ||
        appState.electionEnded;

      let btnText = "Not started";
      let btnIcon = "bi-hourglass";
      if (appState.electionEnded) { btnText = "Election closed"; btnIcon = "bi-lock-fill"; }
      else if (appState.hasVoted) { btnText = "Already voted"; btnIcon = "bi-check2-all"; }
      else if (appState.electionStarted) { btnText = "Vote"; btnIcon = "bi-hand-index-thumb-fill"; }

      return `
        <div class="col-md-6 col-xl-4">
          <article class="candidate-card ${isLeader ? "is-leader" : ""}">
            <div class="d-flex justify-content-between align-items-center">
              <span class="candidate-rank">${candidate.id + 1}</span>
              <div class="d-flex align-items-center gap-2">
                ${isLeader ? '<span class="leader-badge"><i class="bi bi-star-fill"></i> Leading</span>' : ""}
                <span class="badge text-bg-light" style="font-size:0.68rem">#${candidate.id}</span>
              </div>
            </div>
            <div>
              <h3 class="h4 mb-1">${escapeHtml(candidate.name)}</h3>
              <p class="progress-label mb-0">One wallet = one vote</p>
            </div>
            <div>
              <div class="d-flex align-items-baseline gap-2">
                <span class="vote-count">${candidate.voteCount}</span>
                <span class="vote-label">vote${candidate.voteCount !== 1 ? "s" : ""}</span>
              </div>
              <div class="progress mt-2" role="progressbar" aria-label="Vote share" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: ${percentage}%"></div>
              </div>
              <div class="progress-label mt-2">${percentage}% of total tally</div>
            </div>
            <button class="btn btn-primary btn-vote mt-auto" data-candidate-id="${candidate.id}" ${disabled ? "disabled" : ""}>
              <i class="bi ${btnIcon} me-1"></i>${btnText}
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
    candidates: candidates.map((c) => ({ id: c.id, name: c.name, voteCount: c.voteCount })),
    canVote: Boolean(appState.contract),
    electionStarted: appState.electionStarted,
    electionEnded: appState.electionEnded,
    isWhitelisted: appState.isWhitelisted,
    hasVoted: appState.hasVoted,
  });
}

function renderCandidatesIfChanged(candidates) {
  const renderKey = buildCandidateRenderKey(candidates);
  if (renderKey === appState.lastCandidateRenderKey) return;
  appState.lastCandidateRenderKey = renderKey;
  renderCandidates(candidates);
}

/* ── Winner banner ── */

function updateWinnerBanner(candidates) {
  if (!appState.electionEnded || !candidates.length) {
    dom.winnerBanner.classList.add("d-none");
    return;
  }

  const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0);
  if (totalVotes === 0) {
    dom.winnerBanner.classList.add("d-none");
    return;
  }

  const maxVotes = Math.max(...candidates.map((c) => c.voteCount));
  const winners = candidates.filter((c) => c.voteCount === maxVotes);

  if (winners.length === 1) {
    const pct = Math.round((maxVotes / totalVotes) * 100);
    dom.winnerName.textContent = winners[0].name;
    dom.winnerDetail.textContent = `${maxVotes} vote${maxVotes !== 1 ? "s" : ""} \u00b7 ${pct}% of total \u00b7 ${totalVotes} total votes cast`;
  } else {
    dom.winnerName.textContent = "Tie!";
    dom.winnerDetail.textContent = `${winners.map((w) => w.name).join(", ")} tied with ${maxVotes} vote${maxVotes !== 1 ? "s" : ""} each`;
  }
  dom.winnerBanner.classList.remove("d-none");
}

/* ── Load state from contract ── */

async function loadCandidates() {
  if (!hasDeployment()) {
    appState.lastCandidateRenderKey = "";
    renderCandidates([]);
    setStatus("Contract not deployed. Run npm run deploy:localhost after starting Hardhat node.", "warning");
    return [];
  }

  await createContracts();
  const contract = appState.readOnlyContract;
  const rawCandidates = await contract.getAllCandidates();
  const candidates = rawCandidates.map((c, index) => ({
    id: index,
    name: c.name,
    voteCount: Number(c.voteCount),
  }));

  const summary = await contract.getElectionSummary();
  appState.electionStarted = summary.started;
  appState.electionEnded = summary.ended;
  appState.snapshotVoterCount = Number(summary.votersAtSnapshot);
  appState.totalVotesCast = Number(summary.votesCast);
  appState.candidateCount = Number(summary.candidateCount);
  appState.auditRecordCount = Number(summary.auditRecordCount);

  const round = Number(await contract.electionRound());
  appState.electionRound = round;

  if (appState.electionEnded) {
    dom.electionStatusBadge.className = "badge text-bg-danger";
    dom.electionStatusBadge.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Closed';
  } else if (appState.electionStarted) {
    dom.electionStatusBadge.className = "badge text-bg-success";
    dom.electionStatusBadge.innerHTML = `<i class="bi bi-broadcast me-1"></i>Active \u00b7 ${appState.snapshotVoterCount} voters`;
  } else {
    dom.electionStatusBadge.className = "badge text-bg-secondary";
    dom.electionStatusBadge.innerHTML = '<i class="bi bi-gear me-1"></i>Preparation';
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

/* ── Audit trail ── */

async function loadAuditTrail() {
  if (!hasDeployment() || !appState.readOnlyContract) return;

  const count = appState.auditRecordCount;
  dom.auditPanel.classList.toggle("d-none", count === 0);

  if (!appState.auditOpen || count === 0) return;

  const records = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const r = await appState.readOnlyContract.getAuditRecord(i);
      return {
        index: i,
        actionType: Number(r.actionType),
        actor: r.actor,
        subject: r.subject,
        refId: Number(r.refId),
        blockNumber: Number(r.blockNumber),
      };
    })
  );

  dom.auditTableBody.innerHTML = records
    .map(
      (r) => `
      <tr>
        <td>${r.index}</td>
        <td><span class="audit-action-badge audit-action-${r.actionType}">${escapeHtml(ACTION_LABELS[r.actionType] || `Action ${r.actionType}`)}</span></td>
        <td title="${escapeHtml(r.actor)}">${shortenAddress(r.actor)}</td>
        <td title="${escapeHtml(r.subject)}">${r.subject === ZERO_ADDRESS ? "\u2014" : shortenAddress(r.subject)}</td>
        <td>${r.refId}</td>
        <td>${r.blockNumber}</td>
      </tr>
    `
    )
    .join("");
}

/* ── Sync ── */

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
    updateWinnerBanner(candidates);
    updateTurnout();
    updateStats();
    updateRoundBadge();
    await loadAuditTrail();
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

/* ── Write actions ── */

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
    showToast("Wallet connected!", "success");
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
    showToast("Switched to Hardhat network.", "success");
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
        showToast("Hardhat network added.", "success");
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
    if (!Number.isInteger(candidateId) || candidateId < 0) throw new Error("Invalid candidate id.");

    showSpinner();
    setStatus("Submitting vote transaction. Confirm in MetaMask...", "warning");
    const transaction = await appState.contract.vote(candidateId);
    await transaction.wait();
    hideSpinner();
    showToast("Vote submitted successfully!", "success");
    setStatus("Vote submitted successfully.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Vote failed.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
  }
}

async function addCandidate(event) {
  event.preventDefault();
  try {
    await ensureReadyForWrite();
    const name = dom.candidateName.value.trim();
    if (!name) throw new Error("Candidate name is required.");
    if (name.length > MAX_CANDIDATE_NAME_LENGTH) throw new Error(`Name must be \u2264 ${MAX_CANDIDATE_NAME_LENGTH} characters.`);

    showSpinner();
    setStatus("Creating candidate. Confirm in MetaMask...", "warning");
    const transaction = await appState.contract.addCandidate(name);
    await transaction.wait();
    hideSpinner();
    dom.candidateName.value = "";
    showToast(`Candidate "${name}" added!`, "success");
    setStatus("Candidate created successfully.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Unable to add candidate.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
  }
}

async function whitelistVoter(event) {
  event.preventDefault();
  try {
    await ensureReadyForWrite();
    const voterAddressInput = dom.voterAddress.value.trim();
    if (!ethers.isAddress(voterAddressInput)) throw new Error("Enter a valid wallet address.");

    const voterAddress = ethers.getAddress(voterAddressInput);
    if (voterAddress.toLowerCase() === ZERO_ADDRESS) throw new Error("Zero address is not allowed.");

    showSpinner();
    setStatus("Whitelisting voter. Confirm in MetaMask...", "warning");
    const transaction = await appState.contract.whitelistVoter(voterAddress);
    await transaction.wait();
    hideSpinner();
    dom.voterAddress.value = "";
    showToast(`Voter ${shortenAddress(voterAddress)} whitelisted!`, "success");
    setStatus("Voter access granted successfully.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Unable to whitelist voter.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
  }
}

async function startElection() {
  try {
    await ensureReadyForWrite();
    const summary = await appState.readOnlyContract.getElectionSummary();
    if (summary.started && !summary.ended) {
      throw new Error("Election is already active. End it before starting a new round.");
    }

    showSpinner();
    setStatus("Starting election. Confirm in MetaMask...", "warning");
    const transaction = await appState.contract.startElection();
    await transaction.wait();
    hideSpinner();
    showToast("Election started! Parameters are frozen.", "success");
    setStatus("Election started. Parameters are now frozen.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Unable to start election.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
  }
}

async function endElection() {
  try {
    await ensureReadyForWrite();

    showSpinner();
    setStatus("Closing election. Confirm in MetaMask...", "warning");
    const transaction = await appState.contract.endElection();
    await transaction.wait();
    hideSpinner();
    showToast("Election closed. Results are final.", "success");
    setStatus("Election closed successfully.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Unable to close election.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
  }
}

/* ── Listeners ── */

function registerProviderListeners() {
  if (!window.ethereum) return;

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
  if (appState.pollHandle) clearInterval(appState.pollHandle);
  appState.pollHandle = window.setInterval(async () => {
    if (hasDeployment()) await syncUi();
  }, POLL_INTERVAL_MS);
}

async function bootstrap() {
  dom.connectWalletButton.addEventListener("click", connectWallet);
  dom.switchNetworkButton.addEventListener("click", switchNetwork);
  dom.candidateForm.addEventListener("submit", addCandidate);
  dom.whitelistForm.addEventListener("submit", whitelistVoter);
  dom.startElectionButton.addEventListener("click", startElection);
  dom.endElectionButton.addEventListener("click", endElection);

  dom.toggleAuditButton.addEventListener("click", async () => {
    appState.auditOpen = !appState.auditOpen;
    dom.auditBody.classList.toggle("d-none", !appState.auditOpen);
    dom.toggleAuditButton.innerHTML = appState.auditOpen
      ? '<i class="bi bi-chevron-up me-1"></i>Hide'
      : '<i class="bi bi-chevron-down me-1"></i>Show';
    if (appState.auditOpen) await loadAuditTrail();
  });

  registerProviderListeners();
  startPolling();
  await syncUi();
}

bootstrap();
