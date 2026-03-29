const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const DEFAULT_CANDIDATES = ["Alice Johnson", "Bob Smith", "Carol Lee"];
const LOCAL_MNEMONIC = "test test test test test test test test test test test junk";
const TEST_ACCOUNT_COUNT = 6;

async function writeFrontendConfig(votingAddress) {
  const artifact = await hre.artifacts.readArtifact("Voting");
  const network = await hre.ethers.provider.getNetwork();

  const configContent = `window.CONTRACT_CONFIG = ${JSON.stringify(
    {
      contractAddress: votingAddress,
      chainId: Number(network.chainId),
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
      label: index === 0 ? "Owner / Admin" : `Voter ${index}`,
    };
  });
}

async function writeTestAccountsMarkdown() {
  const network = await hre.ethers.provider.getNetwork();
  const accounts = buildLocalTestAccounts();
  const lines = [
    "# Local Test Accounts",
    "",
    "Security warning: These keys are for local Hardhat testing only. Never use them on public networks.",
    "",
    `- Network: ${network.name}`,
    `- Chain ID: ${Number(network.chainId)}`,
    `- Generated at: ${new Date().toISOString()}`,
    "",
    "| Label | Index | Address | Private Key | Derivation Path |",
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
