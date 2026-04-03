const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const DEFAULT_CANDIDATES = ["Nguyễn Thế Huy", "Võ Huy Khánh", "Trương Thanh Nga", "Dương Long Thành", "Dương Văn Hạnh"];
const LOCAL_MNEMONIC = "test test test test test test test test test test test junk";
const TEST_ACCOUNT_COUNT = 6;

async function writeFrontendConfig(votingAddress) {
  const artifact = await hre.artifacts.readArtifact("Voting");
  const network = await hre.ethers.provider.getNetwork();

  const configContent = `window.CONTRACT_CONFIG = ${JSON.stringify(
    {
      contractAddress: votingAddress,
      chainId: Number(network.chainId),
      rpcUrl: "http://127.0.0.1:8545",
      abi: artifact.abi,
    },
    null,
    2
  )};\n`;

  const outputPath = path.join(__dirname, "..", "frontend", "js", "contract-config.js");
  fs.writeFileSync(outputPath, configContent, "utf8");
}

function buildLocalTestAccounts() {
  return Array.from({ length: TEST_ACCOUNT_COUNT }, (_, index) => {
    const derivationPath = `m/44'/60'/0'/0/${index}`;
    const wallet = hre.ethers.HDNodeWallet.fromPhrase(LOCAL_MNEMONIC, undefined, derivationPath);

    return {
      index,
      address: wallet.address,
      privateKey: wallet.privateKey,
      derivationPath,
      label: index === 0 ? "Owner / Quản trị" : ["Nguyễn Minh Khôi", "Nguyễn Thanh Nhật", "Trần Doãn Hòa"][index - 1] || `Cử tri ${index}`,
    };
  });
}

async function writeTestAccountsMarkdown() {
  const network = await hre.ethers.provider.getNetwork();
  const accounts = buildLocalTestAccounts();
  const lines = [
    "# Tài Khoản Test Local",
    "",
    "⚠️ **Cảnh báo bảo mật:** Các khóa bí mật (Private Key) này chỉ dùng cho môi trường Hardhat local. Tuyệt đối KHÔNG sử dụng trên mạng thật.",
    "",
    `- Mạng: ${network.name}`,
    `- Chain ID: ${Number(network.chainId)}`,
    `- RPC URL: http://127.0.0.1:8545`,
    `- Thời gian tạo: ${new Date().toISOString()}`,
    "",
    "## Danh sách tài khoản",
    "",
    "| Vai trò | Index | Địa chỉ ví | Khóa bí mật (Private Key) | Derivation Path |",
    "| --- | --- | --- | --- | --- |",
    ...accounts.map(
      (account) =>
        `| ${account.label} | ${account.index} | ${account.address} | ${account.privateKey} | ${account.derivationPath} |`
    ),
    "",
  ];

  const outputPath = path.join(__dirname, "..", "tai-khoan-test-local.md");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying Voting contract with account: ${deployer.address}`);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const votingAddress = await voting.getAddress();
  console.log(`Voting contract deployed to: ${votingAddress}`);

  for (const candidateName of DEFAULT_CANDIDATES) {
    const transaction = await voting.addCandidate(candidateName);
    await transaction.wait();
    console.log(`Added candidate: ${candidateName}`);
  }

  await writeFrontendConfig(votingAddress);
  await writeTestAccountsMarkdown();
  console.log("Frontend contract config updated.");
  console.log("Local test account markdown updated (tai-khoan-test-local.md).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
