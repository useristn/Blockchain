const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const DEFAULT_CANDIDATES = ["Alice Johnson", "Bob Smith", "Carol Lee"];

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
  console.log("Frontend contract config updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
