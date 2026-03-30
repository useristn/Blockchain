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

function divider(title) {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(50)}`);
}

async function main() {
  const votingAddress = getDeploymentAddress();
  const [owner, voterOne, voterTwo, outsider] = await hre.ethers.getSigners();
  const voting = await hre.ethers.getContractAt("Voting", votingAddress);

  console.log(`Using deployed contract: ${votingAddress}`);

  /* ── Phase 1: Setup ── */
  divider("PHASE 1 — Whitelist voters & start election");

  let tx = await voting.whitelistVoter(voterOne.address);
  await tx.wait();
  console.log(`✔ Whitelisted Voter 1: ${voterOne.address}`);

  tx = await voting.whitelistVoter(voterTwo.address);
  await tx.wait();
  console.log(`✔ Whitelisted Voter 2: ${voterTwo.address}`);

  tx = await voting.startElection();
  await tx.wait();
  console.log("✔ Election started (round 1)");

  /* ── Phase 2: Access control checks ── */
  divider("PHASE 2 — Access control verification");

  try {
    await voting.whitelistVoter(outsider.address);
    throw new Error("Whitelist after start should have reverted.");
  } catch (error) {
    assert.match(error.message, /parameters are frozen/i);
    console.log("✔ Whitelist correctly frozen after election start");
  }

  try {
    await voting.connect(outsider).vote(0);
    throw new Error("Outsider vote should have reverted.");
  } catch (error) {
    assert.match(error.message, /not allowed to vote/i);
    console.log("✔ Non-whitelisted voter correctly rejected");
  }

  /* ── Phase 3: Cast votes ── */
  divider("PHASE 3 — Cast votes");

  tx = await voting.connect(voterOne).vote(0);
  await tx.wait();
  console.log(`✔ Voter 1 voted for candidate #0 (Alice Johnson)`);

  tx = await voting.connect(voterTwo).vote(1);
  await tx.wait();
  console.log(`✔ Voter 2 voted for candidate #1 (Bob Smith)`);

  // Verify double-vote protection
  try {
    await voting.connect(voterOne).vote(1);
    throw new Error("Double vote should have reverted.");
  } catch (error) {
    assert.match(error.message, /already voted/i);
    console.log("✔ Double-vote correctly prevented");
  }

  /* ── Phase 4: End election & show results ── */
  divider("PHASE 4 — End election & results");

  tx = await voting.endElection();
  await tx.wait();
  console.log("✔ Election ended");

  const candidates = await voting.getAllCandidates();
  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);
  console.log("\nRound 1 results:");
  candidates.forEach((c, i) => {
    const pct = totalVotes > 0 ? Math.round((Number(c.voteCount) / totalVotes) * 100) : 0;
    console.log(`  #${i} ${c.name}: ${c.voteCount} vote(s) (${pct}%)`);
  });

  const summary = await voting.getElectionSummary();
  assert.equal(summary.votersAtSnapshot, 2n);
  assert.equal(summary.votesCast, 2n);
  console.log(`\nSnapshot voters: ${summary.votersAtSnapshot}`);
  console.log(`Total votes cast: ${summary.votesCast}`);
  console.log(`Audit records: ${summary.auditRecordCount}`);

  /* ── Phase 5: Multi-round — start round 2 ── */
  divider("PHASE 5 — Start new election round");

  tx = await voting.startElection();
  await tx.wait();
  const round2 = await voting.electionRound();
  console.log(`✔ Round ${round2} started`);

  // Verify vote tallies are reset
  const freshCandidates = await voting.getAllCandidates();
  freshCandidates.forEach((c, i) => {
    assert.equal(Number(c.voteCount), 0, `Candidate #${i} vote count should reset`);
  });
  console.log("✔ All vote tallies reset to zero for new round");

  // Verify voters can vote again
  assert.equal(await voting.hasVoted(voterOne.address), false);
  assert.equal(await voting.hasVoted(voterTwo.address), false);
  console.log("✔ All voters eligible to vote again");

  // Cast one vote in round 2 for different results
  tx = await voting.connect(voterOne).vote(2);
  await tx.wait();
  console.log(`✔ Voter 1 voted for candidate #2 (Carol Lee) in round 2`);

  tx = await voting.connect(voterTwo).vote(2);
  await tx.wait();
  console.log(`✔ Voter 2 voted for candidate #2 (Carol Lee) in round 2`);

  tx = await voting.endElection();
  await tx.wait();
  console.log("✔ Round 2 ended");

  const round2Candidates = await voting.getAllCandidates();
  const round2Total = round2Candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);
  console.log("\nRound 2 results:");
  round2Candidates.forEach((c, i) => {
    const pct = round2Total > 0 ? Math.round((Number(c.voteCount) / round2Total) * 100) : 0;
    const tag = Number(c.voteCount) === Math.max(...round2Candidates.map((x) => Number(x.voteCount))) && Number(c.voteCount) > 0 ? " ★ WINNER" : "";
    console.log(`  #${i} ${c.name}: ${c.voteCount} vote(s) (${pct}%)${tag}`);
  });

  /* ── Summary ── */
  divider("DEMO COMPLETE");

  const finalAudit = await voting.getAuditTrailCount();
  console.log(`Total audit records: ${finalAudit}`);
  console.log(`Final election round: ${await voting.electionRound()}`);
  console.log(`Owner: ${owner.address}`);
  console.log(`Voter 1: ${voterOne.address}`);
  console.log(`Voter 2: ${voterTwo.address}`);
  console.log(`Outsider: ${outsider.address}`);
  console.log("\nAll checks passed. The system is fully functional.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
