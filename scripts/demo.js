const assert = require("assert");
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function getDeploymentAddress() {
  const configPath = path.join(__dirname, "..", "frontend", "js", "contract-config.js");
  const raw = fs.readFileSync(configPath, "utf8");
  const prefix = "window.CONTRACT_CONFIG = ";

  if (!raw.startsWith(prefix)) {
    throw new Error("frontend/js/contract-config.js is missing a valid deployment.");
  }

  const json = raw.slice(prefix.length).trim().replace(/;$/, "");
  return JSON.parse(json).contractAddress;
}

async function main() {
  const votingAddress = getDeploymentAddress();
  const [owner, voterOne, voterTwo, outsider] = await hre.ethers.getSigners();
  const voting = await hre.ethers.getContractAt("Voting", votingAddress);

  console.log(`Using deployed contract: ${votingAddress}`);

  let transaction = await voting.whitelistVoter(voterOne.address);
  await transaction.wait();

  transaction = await voting.whitelistVoter(voterTwo.address);
  await transaction.wait();

  transaction = await voting.startElection();
  await transaction.wait();

  try {
    await voting.whitelistVoter(outsider.address);
    throw new Error("Whitelist after start should have reverted.");
  } catch (error) {
    assert.match(error.message, /parameters are frozen/i);
    console.log("Verified whitelist is frozen after start.");
  }

  try {
    await voting.connect(outsider).vote(0);
    throw new Error("Outsider vote should have reverted.");
  } catch (error) {
    assert.match(error.message, /not allowed to vote/i);
    console.log("Verified outsider cannot vote.");
  }

  transaction = await voting.connect(voterOne).vote(0);
  await transaction.wait();

  transaction = await voting.connect(voterTwo).vote(1);
  await transaction.wait();

  const candidateZero = await voting.getCandidate(0);
  const candidateOne = await voting.getCandidate(1);
  const summary = await voting.getElectionSummary();

  assert.equal(candidateZero[1], 1n, "Candidate 0 should have 1 vote.");
  assert.equal(candidateOne[1], 1n, "Candidate 1 should have 1 vote.");
  assert.equal(summary.votersAtSnapshot, 2n, "Snapshot voters should equal whitelisted voters at start.");

  console.log("Demo completed successfully.");
  console.log(`- ${candidateZero[0]}: ${candidateZero[1]} vote(s)`);
  console.log(`- ${candidateOne[0]}: ${candidateOne[1]} vote(s)`);
  console.log(`Snapshot voters: ${summary.votersAtSnapshot}`);
  console.log(`Audit records: ${summary.auditRecordCount}`);
  console.log(`Owner account: ${owner.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
