const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  async function deployVotingFixture() {
    const [owner, voter, secondVoter, outsider] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();

    await voting.addCandidate("Nguyễn Thế Huy");
    await voting.addCandidate("Võ Huy Khánh");

    return { voting, owner, voter, secondVoter, outsider };
  }

  it("lets the owner add candidates before election starts", async function () {
    const { voting } = await deployVotingFixture();

    expect(await voting.getCandidatesCount()).to.equal(2);

    const candidate = await voting.getCandidate(0);
    expect(candidate[0]).to.equal("Nguyễn Thế Huy");
    expect(candidate[1]).to.equal(0);
  });

  it("blocks non-owners from mutating admin actions", async function () {
    const { voting, outsider } = await deployVotingFixture();

    await expect(voting.connect(outsider).addCandidate("Trương Thanh Nga")).to.be.revertedWith(
      "Only owner can call this function"
    );

    await expect(voting.connect(outsider).whitelistVoter(outsider.address)).to.be.revertedWith(
      "Only owner can call this function"
    );

    await expect(voting.connect(outsider).startElection()).to.be.revertedWith("Only owner can call this function");
  });

  it("enforces election snapshot and one vote per whitelisted voter", async function () {
    const { voting, voter, secondVoter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.whitelistVoter(secondVoter.address);

    await expect(voting.startElection()).to.emit(voting, "ElectionStarted");

    await expect(voting.connect(voter).vote(1)).to.emit(voting, "Voted").withArgs(voter.address, 1);

    const candidate = await voting.getCandidate(1);
    expect(candidate[1]).to.equal(1);
    expect(await voting.hasVoted(voter.address)).to.equal(true);

    await expect(voting.connect(voter).vote(1)).to.be.revertedWith("You have already voted");
  });

  it("freezes election parameters after election starts", async function () {
    const { voting, outsider } = await deployVotingFixture();

    await voting.whitelistVoter(outsider.address);
    await voting.startElection();

    await expect(voting.addCandidate("Trương Thanh Nga")).to.be.revertedWith("Election parameters are frozen");
    await expect(voting.whitelistVoter(outsider.address)).to.be.revertedWith("Election parameters are frozen");
  });

  it("allows owner to configure and start a new round after ending election", async function () {
    const { voting, voter, secondVoter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.startElection();
    await voting.connect(voter).vote(0);
    await voting.endElection();

    await voting.addCandidate("Trương Thanh Nga");
    await voting.whitelistVoter(secondVoter.address);

    await expect(voting.startElection()).to.emit(voting, "ElectionStarted");

    const firstCandidate = await voting.getCandidate(0);
    expect(firstCandidate.voteCount).to.equal(0n);

    await expect(voting.connect(voter).vote(1)).to.emit(voting, "Voted").withArgs(voter.address, 1);
    await expect(voting.connect(secondVoter).vote(2)).to.emit(voting, "Voted").withArgs(secondVoter.address, 2);
  });

  it("rejects a voter that is not whitelisted", async function () {
    const { voting, voter, outsider } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.startElection();

    await expect(voting.connect(outsider).vote(0)).to.be.revertedWith("You are not allowed to vote");
  });

  it("prevents voting before start and after close", async function () {
    const { voting, voter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);

    await expect(voting.connect(voter).vote(0)).to.be.revertedWith("Election has not started");

    await voting.startElection();
    await voting.endElection();

    await expect(voting.connect(voter).vote(0)).to.be.revertedWith("Election has ended");
  });

  it("exposes standardized audit trail and summary", async function () {
    const { voting, voter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.startElection();
    await voting.connect(voter).vote(0);
    await voting.endElection();

    const auditCount = await voting.getAuditTrailCount();
    expect(auditCount).to.equal(6n);

    const startRecord = await voting.getAuditRecord(3);
    expect(startRecord.actionType).to.equal(3);

    const summary = await voting.getElectionSummary();
    expect(summary.started).to.equal(true);
    expect(summary.ended).to.equal(true);
    expect(summary.votersAtSnapshot).to.equal(1n);
    expect(summary.votesCast).to.equal(1n);
    expect(summary.candidateCount).to.equal(2n);
    expect(summary.auditRecordCount).to.equal(6n);
  });

  it("tracks hasVoted by current election round", async function () {
    const { voting, voter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.startElection();
    await voting.connect(voter).vote(0);
    expect(await voting.hasVoted(voter.address)).to.equal(true);

    await voting.endElection();
    await voting.startElection();
    expect(await voting.hasVoted(voter.address)).to.equal(false);
  });

  it("returns all candidates for frontend rendering", async function () {
    const { voting } = await deployVotingFixture();

    const candidates = await voting.getAllCandidates();
    expect(candidates).to.have.length(2);
    expect(candidates[0].name).to.equal("Nguyễn Thế Huy");
    expect(candidates[1].name).to.equal("Võ Huy Khánh");
  });

  it("hasVoted returns false for all addresses before first election", async function () {
    const { voting, voter, outsider } = await deployVotingFixture();

    expect(await voting.hasVoted(voter.address)).to.equal(false);
    expect(await voting.hasVoted(outsider.address)).to.equal(false);
  });
});
