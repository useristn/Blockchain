const { ethers } = window;

const POLL_INTERVAL_MS = 5000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MAX_CANDIDATE_NAME_LENGTH = 64;

const ACTION_LABELS = {
  1: "Thêm ứng cử viên",
  2: "Xác nhận cử tri",
  3: "Bắt đầu bầu cử",
  4: "Bỏ phiếu",
  5: "Kết thúc bầu cử",
  6: "Đặt lại vòng",
};

/* ── Candidate biography database ── */
const CANDIDATE_BIOS = {
  "Nguyễn Thế Huy": {
    ngaySinh: "06/01/1994",
    gioiTinh: "Nam",
    quocTich: "Việt Nam",
    danToc: "Kinh",
    tonGiao: "Không",
    queQuan: "Phường Bến Cát, Thành phố Hồ Chí Minh",
    noiO: "216 Ngô Gia Tự, tổ 95, khu 11, phường Thủ Dầu Một, Thành phố Hồ Chí Minh",
    giaoDucPhoThong: "12/12",
    ngoaiNgu: "Tiếng Anh IELTS 6.5",
    hocHam: "Cử nhân",
    trinhDoChinhTri: "Trung cấp",
    chuyenMon: "Đại học chuyên ngành Tài chính",
    ngheNghiep: "Phó Bí thư Đảng ủy, Phó Chủ tịch Hội đồng quản trị, Phó Tổng Giám đốc Tập đoàn Đầu tư và phát triển công nghiệp Becamex - CTSP; Chủ tịch Hội đồng thành viên Công ty TNHH MTV WTC Becamex",
    noiCongTac: "Tập đoàn Đầu tư và phát triển công nghiệp Becamex – CTSP",
    ngayVaoDang: "10/03/2022",
    daiBieuQH: "Không",
    daiBieuHDND: "Không",
  },
  "Võ Huy Khánh": {
    ngaySinh: "15/07/1988",
    gioiTinh: "Nam",
    quocTich: "Việt Nam",
    danToc: "Kinh",
    tonGiao: "Không",
    queQuan: "Xã Hòa Phú, Huyện Củ Chi, Thành phố Hồ Chí Minh",
    noiO: "45 Nguyễn Văn Trỗi, Phường 15, Quận Phú Nhuận, Thành phố Hồ Chí Minh",
    giaoDucPhoThong: "12/12",
    ngoaiNgu: "Tiếng Anh TOEIC 780",
    hocHam: "Thạc sĩ",
    trinhDoChinhTri: "Cao cấp",
    chuyenMon: "Thạc sĩ Quản lý công, Đại học Kinh tế Thành phố Hồ Chí Minh",
    ngheNghiep: "Ủy viên Ban Chấp hành Đảng bộ, Phó Giám đốc Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh",
    noiCongTac: "Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh",
    ngayVaoDang: "20/08/2015",
    daiBieuQH: "Không",
    daiBieuHDND: "Không",
  },
  "Trương Thanh Nga": {
    ngaySinh: "22/11/1990",
    gioiTinh: "Nữ",
    quocTich: "Việt Nam",
    danToc: "Kinh",
    tonGiao: "Phật giáo",
    queQuan: "Phường Tân Định, Quận 1, Thành phố Hồ Chí Minh",
    noiO: "78 Lý Tự Trọng, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh",
    giaoDucPhoThong: "12/12",
    ngoaiNgu: "Tiếng Anh IELTS 7.0, Tiếng Pháp B2",
    hocHam: "Tiến sĩ",
    trinhDoChinhTri: "Cao cấp",
    chuyenMon: "Tiến sĩ Luật học, Đại học Luật Thành phố Hồ Chí Minh",
    ngheNghiep: "Phó Chủ tịch Hội Liên hiệp Phụ nữ Thành phố Hồ Chí Minh; Ủy viên Ủy ban Mặt trận Tổ quốc Việt Nam Thành phố",
    noiCongTac: "Hội Liên hiệp Phụ nữ Thành phố Hồ Chí Minh",
    ngayVaoDang: "15/05/2018",
    daiBieuQH: "Không",
    daiBieuHDND: "Đại biểu HĐND Thành phố khóa X",
  },
  "Dương Long Thành": {
    ngaySinh: "03/09/1985",
    gioiTinh: "Nam",
    quocTich: "Việt Nam",
    danToc: "Kinh",
    tonGiao: "Không",
    queQuan: "Xã Tân Thạnh Đông, Huyện Củ Chi, Thành phố Hồ Chí Minh",
    noiO: "120 Trần Hưng Đạo, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh",
    giaoDucPhoThong: "12/12",
    ngoaiNgu: "Tiếng Anh IELTS 7.5",
    hocHam: "Phó Giáo sư, Tiến sĩ",
    trinhDoChinhTri: "Cao cấp",
    chuyenMon: "Tiến sĩ Kinh tế phát triển, Đại học Kinh tế Quốc dân",
    ngheNghiep: "Phó Giáo sư, Phó Hiệu trưởng Trường Đại học Kinh tế Thành phố Hồ Chí Minh; Ủy viên Hội đồng Khoa học Bộ Giáo dục và Đào tạo",
    noiCongTac: "Trường Đại học Kinh tế Thành phố Hồ Chí Minh",
    ngayVaoDang: "12/10/2012",
    daiBieuQH: "Không",
    daiBieuHDND: "Không",
  },
  "Dương Văn Hạnh": {
    ngaySinh: "18/03/1982",
    gioiTinh: "Nam",
    quocTich: "Việt Nam",
    danToc: "Kinh",
    tonGiao: "Không",
    queQuan: "Thị trấn Hóc Môn, Huyện Hóc Môn, Thành phố Hồ Chí Minh",
    noiO: "55 Pasteur, Phường Nguyễn Thái Bình, Quận 1, Thành phố Hồ Chí Minh",
    giaoDucPhoThong: "12/12",
    ngoaiNgu: "Tiếng Anh IELTS 6.0",
    hocHam: "Thạc sĩ",
    trinhDoChinhTri: "Cao cấp",
    chuyenMon: "Thạc sĩ Xây dựng Đảng và Chính quyền nhà nước, Học viện Chính trị Quốc gia Hồ Chí Minh",
    ngheNghiep: "Thành ủy viên, Bí thư Quận ủy Quận 12, Thành phố Hồ Chí Minh",
    noiCongTac: "Quận ủy Quận 12, Thành phố Hồ Chí Minh",
    ngayVaoDang: "25/04/2008",
    daiBieuQH: "Không",
    daiBieuHDND: "Đại biểu HĐND Thành phố khóa X",
  },
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
  candidateShimmer: document.getElementById("candidateShimmer"),
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
  barChart: document.getElementById("barChart"),
  themeToggle: document.getElementById("themeToggle"),
  heroSteps: document.getElementById("heroSteps"),
  stepWallet: document.getElementById("stepWallet"),
  stepNetwork: document.getElementById("stepNetwork"),
  stepVote: document.getElementById("stepVote"),
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
  lastVoteCountSnapshot: {},
  auditOpen: false,
  // Bug fix: track tx-in-progress per form
  txInProgress: { addCandidate: false, whitelist: false, startEnd: false, vote: false },
  profileKeyHandler: null,
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
  if (!address) return "Chưa kết nối";
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
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    </div>
  `;
  dom.toastContainer.insertAdjacentHTML("beforeend", html);
  const toastEl = document.getElementById(id);
  toastEl.style.opacity = "0";
  toastEl.style.transition = "opacity 0.3s ease";
  requestAnimationFrame(() => { toastEl.style.opacity = "1"; });

  toastEl.querySelector(".btn-close")?.addEventListener("click", () => {
    toastEl.style.opacity = "0";
    setTimeout(() => toastEl.remove(), 350);
  });

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
    const provider = await ensureProvider();
    appState.signer = await provider.getSigner();
    appState.contract = new ethers.Contract(
      window.CONTRACT_CONFIG.contractAddress,
      window.CONTRACT_CONFIG.abi,
      appState.signer
    );
    return;
  }

  appState.signer = null;
  appState.contract = null;
}

/* ── UI State ── */

function updateHeroSteps() {
  const steps = [dom.stepWallet, dom.stepNetwork, dom.stepVote];
  const stateMap = [
    appState.account !== null,
    appState.isCorrectNetwork,
    (appState.isWhitelisted && appState.electionStarted) || appState.hasVoted,
  ];

  let activeIndex = 0;
  for (let i = 0; i < stateMap.length; i++) {
    if (stateMap[i]) activeIndex = i + 1;
  }
  activeIndex = Math.min(activeIndex, stateMap.length);

  steps.forEach((step, i) => {
    step.classList.remove("done", "active");
    if (i < activeIndex - 1) step.classList.add("done");
    if (i === activeIndex - 1 && activeIndex < stateMap.length) step.classList.add("active");
    if (activeIndex === stateMap.length) steps.forEach(s => s.classList.add("done"));
  });
}

async function updateConnectionState() {
  dom.accountValue.textContent = shortenAddress(appState.account);

  if (!window.ethereum) {
    dom.networkValue.textContent = "Thiếu MetaMask";
    dom.eligibilityValue.textContent = "Cài MetaMask";
    appState.isCorrectNetwork = false;
    return;
  }

  const chainId = await getCurrentChainId();
  const isCorrectNetwork = chainId && chainId.toLowerCase() === getTargetChainIdHex().toLowerCase();
  appState.isCorrectNetwork = isCorrectNetwork;
  dom.networkValue.textContent = isCorrectNetwork
    ? `Hardhat (${parseInt(chainId, 16)})`
    : `Sai (${chainId ? parseInt(chainId, 16) : "?"})`;

  if (!appState.account) {
    dom.eligibilityValue.textContent = "Chỉ xem";
    return;
  }

  if (appState.isOwner) {
    if (!appState.electionStarted) {
      dom.eligibilityValue.textContent = "Quản trị · Thiết lập";
      return;
    }
    dom.eligibilityValue.textContent = appState.electionEnded ? "Quản trị · Đã đóng" : "Quản trị · Đang diễn ra";
    return;
  }

  if (!appState.electionStarted) {
    dom.eligibilityValue.textContent = "Đang chờ";
    return;
  }

  if (appState.hasVoted) {
    dom.eligibilityValue.textContent = "Đã bỏ phiếu \u2713";
    return;
  }

  dom.eligibilityValue.textContent = appState.isWhitelisted ? "Đủ điều kiện" : "Chưa được xác nhận";
}

function updateTurnout() {
  if (appState.snapshotVoterCount > 0) {
    const pct = Math.round((appState.totalVotesCast / appState.snapshotVoterCount) * 100);
    dom.turnoutValue.textContent = `${appState.totalVotesCast}/${appState.snapshotVoterCount} (${pct}%)`;
  } else {
    dom.turnoutValue.textContent = "\u2014";
  }
}

function updateStats(oldTotals) {
  const oldVote = oldTotals?.totalVotesCast ?? appState.totalVotesCast;

  dom.statTotalVotes.textContent = appState.totalVotesCast;
  dom.statCandidates.textContent = appState.candidateCount;
  dom.statSnapshot.textContent = appState.snapshotVoterCount;
  dom.statAudit.textContent = appState.auditRecordCount;
  dom.statsPanel.classList.toggle("d-none", !hasDeployment());

  // Bump animation when vote count changes
  if (appState.totalVotesCast !== oldVote) {
    dom.statTotalVotes.classList.remove("bump");
    void dom.statTotalVotes.offsetWidth; // force reflow
    dom.statTotalVotes.classList.add("bump");
  }
}

function updateRoundBadge() {
  dom.roundBadge.textContent = appState.electionRound > 0 ? `Vòng ${appState.electionRound}` : "Vòng \u2014";
}

function buildReadyStatus() {
  if (!hasDeployment()) {
    return { message: "Hợp đồng chưa triển khai. Chạy npm run deploy:localhost sau khi khởi động Hardhat node.", tone: "warning" };
  }
  if (!window.ethereum) {
    return { message: "Chế độ chỉ xem. Cài đặt hoặc mở khóa MetaMask để gửi giao dịch.", tone: "secondary" };
  }
  if (!appState.account) {
    return { message: "Đã đồng bộ hợp đồng. Kết nối ví để tham gia bầu cử.", tone: "secondary" };
  }
  if (!appState.isCorrectNetwork) {
    return { message: "Phát hiện sai mạng. Chuyển MetaMask sang Hardhat Localhost.", tone: "warning" };
  }
  if (appState.isOwner) {
    if (!appState.electionStarted) return { message: "Quản trị viên đã kết nối. Thêm ứng cử viên, xác nhận cử tri hoặc bắt đầu bầu cử.", tone: "info" };
    if (appState.electionEnded) return { message: "Bầu cử đã kết thúc. Bạn có thể bắt đầu vòng mới.", tone: "secondary" };
    return { message: "Bầu cử đang diễn ra. Theo dõi phiếu bầu theo thời gian thực.", tone: "info" };
  }
  if (!appState.electionStarted) return { message: "Đang chờ quản trị viên bắt đầu bầu cử.", tone: "secondary" };
  if (appState.electionEnded) return { message: "Bầu cử đã kết thúc. Kết quả cuối cùng hiển thị bên dưới.", tone: "secondary" };
  if (appState.hasVoted) return { message: "Phiếu bầu của bạn đã được ghi nhận trên blockchain.", tone: "success" };
  if (appState.isWhitelisted) return { message: "Bạn đủ điều kiện bỏ phiếu. Hãy chọn ứng cử viên bên dưới.", tone: "success" };
  return { message: "Ví đã kết nối nhưng chưa được xác nhận cho cuộc bầu cử này.", tone: "warning" };
}

/* ── Confetti ── */

function showConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  const colors = ["#d4382c", "#f59e0b", "#198754", "#0d6efd", "#c8102e", "#6f42c1", "#e85d52"];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("div");
    p.className = "confetti-particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = Math.random() * 1 + "s";
    p.style.animationDuration = (2 + Math.random() * 2) + "s";
    p.style.width = (6 + Math.random() * 6) + "px";
    p.style.height = (6 + Math.random() * 6) + "px";
    container.appendChild(p);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 5000);
}

/* ── Bar chart ── */

function updateBarChart(candidates) {
  if (!candidates.length || appState.totalVotesCast === 0) {
    dom.barChart.style.display = "none";
    return;
  }

  dom.barChart.style.display = "flex";
  const maxVotes = Math.max(...candidates.map(c => c.voteCount), 1);
  const maxHeight = 100;

  dom.barChart.innerHTML = candidates.map(c => {
    const heightPct = Math.max((c.voteCount / maxVotes) * maxHeight, 4);
    const isWinner = c.voteCount === maxVotes && c.voteCount > 0;
    return `
      <div class="bar-group">
        <span class="bar-amount">${c.voteCount}</span>
        <div class="bar-col ${isWinner ? 'is-winner' : ''}" style="height:${heightPct}%"></div>
        <span class="bar-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name.split(' ').pop())}</span>
      </div>
    `;
  }).join("");
}

/* ── Render candidates ── */

function getCandidateBio(name) {
  return CANDIDATE_BIOS[name] || null;
}

function renderProfileModal(name) {
  const bio = getCandidateBio(name);
  if (!bio) return;

  // Bug fix: remove existing modal and key handler before adding new one
  const existing = document.getElementById("profileModal");
  if (existing) {
    existing.remove();
    if (appState.profileKeyHandler) {
      document.removeEventListener("keydown", appState.profileKeyHandler);
      appState.profileKeyHandler = null;
    }
  }

  const modal = document.createElement("div");
  modal.id = "profileModal";
  modal.className = "profile-modal-overlay";
  modal.innerHTML = `
    <div class="profile-modal">
      <div class="profile-modal-header">
        <h2 class="profile-modal-name">${escapeHtml(name)}</h2>
        <button class="profile-modal-close" aria-label="Đóng">&times;</button>
      </div>
      <div class="profile-modal-body">
        <div class="profile-section">
          <h3 class="profile-section-title"><i class="bi bi-person-vcard me-2"></i>Thông tin cá nhân</h3>
          <div class="profile-grid">
            <div class="profile-field"><span class="profile-label">Ngày tháng năm sinh:</span><span class="profile-value">${escapeHtml(bio.ngaySinh)}</span></div>
            <div class="profile-field"><span class="profile-label">Giới tính:</span><span class="profile-value">${escapeHtml(bio.gioiTinh)}</span></div>
            <div class="profile-field"><span class="profile-label">Quốc tịch:</span><span class="profile-value">${escapeHtml(bio.quocTich)}</span></div>
            <div class="profile-field"><span class="profile-label">Dân tộc:</span><span class="profile-value">${escapeHtml(bio.danToc)}</span></div>
            <div class="profile-field"><span class="profile-label">Tôn giáo:</span><span class="profile-value">${escapeHtml(bio.tonGiao)}</span></div>
            <div class="profile-field"><span class="profile-label">Quê quán:</span><span class="profile-value">${escapeHtml(bio.queQuan)}</span></div>
            <div class="profile-field full-width"><span class="profile-label">Nơi ở hiện nay:</span><span class="profile-value">${escapeHtml(bio.noiO)}</span></div>
          </div>
        </div>
        <div class="profile-section">
          <h3 class="profile-section-title"><i class="bi bi-mortarboard me-2"></i>Trình độ học vấn</h3>
          <div class="profile-grid">
            <div class="profile-field"><span class="profile-label">Giáo dục phổ thông:</span><span class="profile-value">${escapeHtml(bio.giaoDucPhoThong)}</span></div>
            <div class="profile-field"><span class="profile-label">Ngoại ngữ:</span><span class="profile-value">${escapeHtml(bio.ngoaiNgu)}</span></div>
            <div class="profile-field"><span class="profile-label">Học hàm, học vị:</span><span class="profile-value">${escapeHtml(bio.hocHam)}</span></div>
            <div class="profile-field"><span class="profile-label">Trình độ lý luận chính trị:</span><span class="profile-value">${escapeHtml(bio.trinhDoChinhTri)}</span></div>
            <div class="profile-field full-width"><span class="profile-label">Chuyên môn nghiệp vụ:</span><span class="profile-value">${escapeHtml(bio.chuyenMon)}</span></div>
          </div>
        </div>
        <div class="profile-section">
          <h3 class="profile-section-title"><i class="bi bi-briefcase me-2"></i>Công tác</h3>
          <div class="profile-grid">
            <div class="profile-field full-width"><span class="profile-label">Nghề nghiệp, chức vụ:</span><span class="profile-value">${escapeHtml(bio.ngheNghiep)}</span></div>
            <div class="profile-field"><span class="profile-label">Nơi công tác:</span><span class="profile-value">${escapeHtml(bio.noiCongTac)}</span></div>
            <div class="profile-field"><span class="profile-label">Ngày vào Đảng:</span><span class="profile-value">${escapeHtml(bio.ngayVaoDang)}</span></div>
            <div class="profile-field"><span class="profile-label">Đại biểu Quốc hội:</span><span class="profile-value">${escapeHtml(bio.daiBieuQH)}</span></div>
            <div class="profile-field"><span class="profile-label">Đại biểu HĐND:</span><span class="profile-value">${escapeHtml(bio.daiBieuHDND)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Bug fix: store key handler so we can remove it on close
  const keyHandler = (e) => {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", keyHandler);
      appState.profileKeyHandler = null;
    }
  };
  appState.profileKeyHandler = keyHandler;
  document.addEventListener("keydown", keyHandler);

  modal.querySelector(".profile-modal-close").addEventListener("click", () => {
    modal.remove();
    document.removeEventListener("keydown", keyHandler);
    appState.profileKeyHandler = null;
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
      document.removeEventListener("keydown", keyHandler);
      appState.profileKeyHandler = null;
    }
  });

  requestAnimationFrame(() => modal.classList.add("active"));
}

function renderCandidates(candidates) {
  if (!candidates.length) {
    dom.candidateGrid.innerHTML = `
      <div class="col-12">
        <div class="candidate-card" style="text-align:center;padding:2.5rem">
          <i class="bi bi-inbox" style="font-size:2.5rem;color:var(--text-muted);opacity:0.5"></i>
          <h3 class="h5 mb-2 mt-3">Chưa có ứng cử viên</h3>
          <p class="mb-0 text-muted">Deploy hợp đồng và thêm ứng cử viên để bắt đầu.</p>
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

      let btnText = "Chưa bắt đầu";
      let btnIcon = "bi-hourglass";
      if (appState.electionEnded) { btnText = "Bầu cử kết thúc"; btnIcon = "bi-lock-fill"; }
      else if (appState.hasVoted) { btnText = "Đã bỏ phiếu"; btnIcon = "bi-check2-all"; }
      else if (appState.electionStarted) { btnText = "Bỏ phiếu"; btnIcon = "bi-hand-index-thumb-fill"; }

      const bio = getCandidateBio(candidate.name);
      const bioSummary = bio
        ? `<span class="candidate-bio-tag"><i class="bi bi-briefcase me-1"></i>${escapeHtml(bio.hocHam)}</span>
           <span class="candidate-bio-tag"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(bio.noiCongTac.length > 40 ? bio.noiCongTac.substring(0, 40) + "\u2026" : bio.noiCongTac)}</span>`
        : "";

      return `
        <div class="col-md-6 col-xl-4">
          <article class="candidate-card ${isLeader ? "is-leader" : ""}">
            <div class="d-flex justify-content-between align-items-center">
              <span class="candidate-rank">${candidate.id + 1}</span>
              <div class="d-flex align-items-center gap-2">
                ${isLeader ? '<span class="leader-badge"><i class="bi bi-star-fill"></i> Dẫn đầu</span>' : ""}
                <span class="badge text-bg-light" style="font-size:0.68rem">#${candidate.id}</span>
              </div>
            </div>
            <div class="candidate-info-area">
              <div class="candidate-avatar"><i class="bi bi-person-fill"></i></div>
              <div>
                <h3 class="h5 mb-1">${escapeHtml(candidate.name)}</h3>
                <div class="candidate-bio-tags">${bioSummary}</div>
              </div>
            </div>
            ${bio ? `<button class="btn btn-sm btn-outline-info btn-view-profile" data-candidate-name="${escapeHtml(candidate.name)}"><i class="bi bi-file-earmark-person me-1"></i>Xem hồ sơ</button>` : ""}
            <div>
              <div class="d-flex align-items-baseline gap-2">
                <span class="vote-count">${candidate.voteCount}</span>
                <span class="vote-label">phiếu</span>
              </div>
              <div class="progress mt-2" role="progressbar" aria-label="Vote share" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: ${percentage}%"></div>
              </div>
              <div class="progress-label mt-2">${percentage}% tổng số phiếu</div>
            </div>
            <button class="btn btn-primary btn-vote mt-auto" data-candidate-id="${candidate.id}" ${disabled ? "disabled" : ""}>
              <i class="bi ${btnIcon} me-1"></i>${btnText}
            </button>
          </article>
        </div>
      `;
    })
    .join("");

  // Vote button listeners
  document.querySelectorAll(".btn-vote").forEach((button) => {
    button.addEventListener("click", async () => {
      const candidateId = Number(button.dataset.candidateId);
      await submitVote(candidateId);
    });
  });

  // Profile modal listeners
  document.querySelectorAll(".btn-view-profile").forEach((button) => {
    button.addEventListener("click", () => {
      renderProfileModal(button.dataset.candidateName);
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
    dom.winnerDetail.textContent = `${maxVotes} phiếu \u00b7 ${pct}% tổng số \u00b7 ${totalVotes} phiếu đã bỏ`;
  } else {
    dom.winnerName.textContent = "Hòa!";
    dom.winnerDetail.textContent = `${winners.map((w) => w.name).join(", ")} hòa với ${maxVotes} phiếu mỗi người`;
  }
  dom.winnerBanner.classList.remove("d-none");
  showConfetti();
}

/* ── TX Status helpers ── */

function setTxStatus(key, message, type = "pending") {
  const elId = key === "addCandidate" ? "txStatusAdd" : key === "whitelist" ? "txStatusWhitelist" : "txStatusElection";
  const el = document.getElementById(elId);
  if (!el) return;
  const icon = type === "pending" ? '<i class="bi bi-hourglass-split"></i>' : '<i class="bi bi-check-circle-fill"></i>';
  el.className = `tx-status visible ${type}`;
  el.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
}

function clearTxStatus(key) {
  const elId = key === "addCandidate" ? "txStatusAdd" : key === "whitelist" ? "txStatusWhitelist" : "txStatusElection";
  const el = document.getElementById(elId);
  if (el) el.className = "tx-status";
}

/* ── Load state from contract ── */

async function loadCandidates() {
  if (!hasDeployment()) {
    appState.lastCandidateRenderKey = "";
    dom.candidateShimmer.classList.add("d-none");
    dom.candidateGrid.classList.remove("d-none");
    renderCandidates([]);
    setStatus("Hợp đồng chưa triển khai. Chạy npm run deploy:localhost sau khi khởi động Hardhat node.", "warning");
    return [];
  }

  dom.candidateShimmer.classList.remove("d-none");
  dom.candidateGrid.classList.add("d-none");

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
    dom.electionStatusBadge.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Đã đóng';
  } else if (appState.electionStarted) {
    dom.electionStatusBadge.className = "badge text-bg-success";
    dom.electionStatusBadge.innerHTML = `<i class="bi bi-broadcast me-1"></i>Đang diễn ra \u00b7 ${appState.snapshotVoterCount} cử tri`;
  } else {
    dom.electionStatusBadge.className = "badge text-bg-secondary";
    dom.electionStatusBadge.innerHTML = '<i class="bi bi-gear me-1"></i>Chuẩn bị';
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
    const oldTotals = { totalVotesCast: appState.totalVotesCast };
    const candidates = await loadCandidates();
    await refreshAccessState();

    dom.candidateShimmer.classList.add("d-none");
    dom.candidateGrid.classList.remove("d-none");

    renderCandidatesIfChanged(candidates);
    updateWinnerBanner(candidates);
    updateTurnout();
    updateStats(oldTotals);
    updateRoundBadge();
    updateBarChart(candidates);
    updateHeroSteps();
    await loadAuditTrail();
    const readyStatus = buildReadyStatus();
    setStatus(readyStatus.message, readyStatus.tone);
  } catch (error) {
    console.error(error);
    dom.candidateShimmer.classList.add("d-none");
    dom.candidateGrid.classList.remove("d-none");
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
    throw new Error("Kết nối ví trước khi thực hiện giao dịch.");
  }
  await ensureOnConfiguredNetwork();
}

async function connectWallet() {
  try {
    await ensureProvider();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    appState.account = accounts[0] || null;
    showToast("Đã kết nối ví!", "success");
    setStatus("Đã kết nối ví. Đang tải trạng thái hợp đồng...", "info");
    await syncUi();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Kết nối ví thất bại.", "danger");
  }
}

async function switchNetwork() {
  try {
    await ensureProvider();
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: getTargetChainIdHex() }],
    });
    showToast("Đã chuyển sang mạng Hardhat.", "success");
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
        showToast("Đã thêm mạng Hardhat.", "success");
        await syncUi();
        return;
      } catch (addError) {
        console.error(addError);
        setStatus(addError.message || "Không thể thêm mạng Hardhat.", "danger");
        return;
      }
    }
    console.error(error);
    setStatus(error.message || "Không thể chuyển mạng.", "danger");
  }
}

async function submitVote(candidateId) {
  // Bug fix: prevent double-click during pending vote
  if (appState.txInProgress.vote) return;
  try {
    await ensureReadyForWrite();
    if (!Number.isInteger(candidateId) || candidateId < 0) throw new Error("ID ứng cử viên không hợp lệ.");

    appState.txInProgress.vote = true;
    // Disable all vote buttons immediately
    document.querySelectorAll(".btn-vote").forEach(b => b.disabled = true);
    showSpinner();
    setStatus("Đang gửi giao dịch bỏ phiếu. Xác nhận trong MetaMask...", "warning");
    const transaction = await appState.contract.vote(candidateId);
    await transaction.wait();
    hideSpinner();
    showToast("Bỏ phiếu thành công!", "success");
    setStatus("Đã bỏ phiếu thành công.", "success");
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Bỏ phiếu thất bại.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
    await syncUi();
  } finally {
    appState.txInProgress.vote = false;
  }
}

async function addCandidate(event) {
  event.preventDefault();
  // Bug fix: prevent double form submission
  if (appState.txInProgress.addCandidate) return;
  try {
    await ensureReadyForWrite();
    const name = dom.candidateName.value.trim();
    if (!name) throw new Error("Tên ứng cử viên không được để trống.");
    if (name.length > MAX_CANDIDATE_NAME_LENGTH) throw new Error(`Tên phải \u2264 ${MAX_CANDIDATE_NAME_LENGTH} ký tự.`);

    appState.txInProgress.addCandidate = true;
    setTxStatus("addCandidate", "Đang gửi giao dịch...", "pending");
    showSpinner();
    setStatus("Đang tạo ứng cử viên. Xác nhận trong MetaMask...", "warning");
    const transaction = await appState.contract.addCandidate(name);
    await transaction.wait();
    hideSpinner();
    dom.candidateName.value = "";
    showToast(`Đã thêm ứng cử viên "${name}"!`, "success");
    setStatus("Tạo ứng cử viên thành công.", "success");
    setTxStatus("addCandidate", "Thành công!", "success");
    setTimeout(() => clearTxStatus("addCandidate"), 3000);
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Không thể thêm ứng cử viên.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
    setTxStatus("addCandidate", "Lỗi!", "pending");
    setTimeout(() => clearTxStatus("addCandidate"), 3000);
  } finally {
    appState.txInProgress.addCandidate = false;
  }
}

async function whitelistVoter(event) {
  event.preventDefault();
  // Bug fix: prevent double form submission
  if (appState.txInProgress.whitelist) return;
  try {
    await ensureReadyForWrite();
    const voterAddressInput = dom.voterAddress.value.trim();
    if (!ethers.isAddress(voterAddressInput)) throw new Error("Nhập địa chỉ ví hợp lệ.");

    const voterAddress = ethers.getAddress(voterAddressInput);
    if (voterAddress.toLowerCase() === ZERO_ADDRESS) throw new Error("Không cho phép địa chỉ zero.");

    appState.txInProgress.whitelist = true;
    setTxStatus("whitelist", "Đang gửi giao dịch...", "pending");
    showSpinner();
    setStatus("Đang cấp quyền cử tri. Xác nhận trong MetaMask...", "warning");
    const transaction = await appState.contract.whitelistVoter(voterAddress);
    await transaction.wait();
    hideSpinner();
    dom.voterAddress.value = "";
    showToast(`Cử tri ${shortenAddress(voterAddress)} đã được cấp quyền!`, "success");
    setStatus("Cấp quyền cử tri thành công.", "success");
    setTxStatus("whitelist", "Thành công!", "success");
    setTimeout(() => clearTxStatus("whitelist"), 3000);
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Không thể cấp quyền cử tri.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
    setTxStatus("whitelist", "Lỗi!", "pending");
    setTimeout(() => clearTxStatus("whitelist"), 3000);
  } finally {
    appState.txInProgress.whitelist = false;
  }
}

async function startElection() {
  // Bug fix: prevent double-click
  if (appState.txInProgress.startEnd) return;
  try {
    await ensureReadyForWrite();
    const summary = await appState.readOnlyContract.getElectionSummary();
    if (summary.started && !summary.ended) {
      throw new Error("Cuộc bầu cử đang diễn ra. Kết thúc trước khi bắt đầu vòng mới.");
    }

    appState.txInProgress.startEnd = true;
    setTxStatus("election", "Đang gửi giao dịch...", "pending");
    showSpinner();
    setStatus("Đang bắt đầu bầu cử. Xác nhận trong MetaMask...", "warning");
    const transaction = await appState.contract.startElection();
    await transaction.wait();
    hideSpinner();
    showToast("Đã bắt đầu bầu cử! Các thông số đã được khóa.", "success");
    setStatus("Bầu cử đã bắt đầu. Các thông số đã khóa.", "success");
    setTxStatus("election", "Thành công!", "success");
    setTimeout(() => clearTxStatus("election"), 3000);
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Không thể bắt đầu bầu cử.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
    setTxStatus("election", "Lỗi!", "pending");
    setTimeout(() => clearTxStatus("election"), 3000);
  } finally {
    appState.txInProgress.startEnd = false;
  }
}

async function endElection() {
  // Bug fix: prevent double-click
  if (appState.txInProgress.startEnd) return;
  try {
    await ensureReadyForWrite();

    appState.txInProgress.startEnd = true;
    setTxStatus("election", "Đang gửi giao dịch...", "pending");
    showSpinner();
    setStatus("Đang đóng cuộc bầu cử. Xác nhận trong MetaMask...", "warning");
    const transaction = await appState.contract.endElection();
    await transaction.wait();
    hideSpinner();
    showToast("Đã kết thúc bầu cử. Kết quả là chính thức.", "success");
    setStatus("Đã kết thúc bầu cử thành công.", "success");
    setTxStatus("election", "Thành công!", "success");
    setTimeout(() => clearTxStatus("election"), 3000);
    await syncUi();
  } catch (error) {
    hideSpinner();
    console.error(error);
    const msg = error.shortMessage || error.reason || error.message || "Không thể kết thúc bầu cử.";
    showToast(msg, "danger");
    setStatus(msg, "danger");
    setTxStatus("election", "Lỗi!", "pending");
    setTimeout(() => clearTxStatus("election"), 3000);
  } finally {
    appState.txInProgress.startEnd = false;
  }
}

/* ── Dark mode ── */

function initTheme() {
  const saved = localStorage.getItem("voting-dark-mode");
  if (saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
    dom.themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
  } else {
    dom.themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  dom.themeToggle.innerHTML = isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
  localStorage.setItem("voting-dark-mode", isDark);
}

/* ── Listeners ── */

function registerProviderListeners() {
  if (!window.ethereum) return;

  window.ethereum.on("accountsChanged", async (accounts) => {
    appState.account = accounts[0] || null;
    appState.signer = null;
    appState.contract = null;
    appState.txInProgress = { addCandidate: false, whitelist: false, startEnd: false, vote: false };
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
  dom.themeToggle.addEventListener("click", toggleTheme);

  dom.toggleAuditButton.addEventListener("click", async () => {
    appState.auditOpen = !appState.auditOpen;
    dom.auditBody.classList.toggle("d-none", !appState.auditOpen);
    dom.toggleAuditButton.innerHTML = appState.auditOpen
      ? '<i class="bi bi-chevron-up me-1"></i>Ẩn'
      : '<i class="bi bi-chevron-down me-1"></i>Hiện';
    if (appState.auditOpen) await loadAuditTrail();
  });

  initTheme();
  registerProviderListeners();
  startPolling();
  await syncUi();
}

bootstrap();
