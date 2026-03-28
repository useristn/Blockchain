const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  async function deployVotingFixture() {
    const [owner, voter, secondVoter, outsider] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();

    await voting.addCandidate("Alice Johnson");
    await voting.addCandidate("Bob Smith");

    return { voting, owner, voter, secondVoter, outsider };
  }

  it("lets the owner add candidates", async function () {
    const { voting } = await deployVotingFixture();

    expect(await voting.getCandidatesCount()).to.equal(2);

    const candidate = await voting.getCandidate(0);
    expect(candidate[0]).to.equal("Alice Johnson");
    expect(candidate[1]).to.equal(0);
  });

  it("blocks non-owners from mutating admin actions", async function () {
    const { voting, outsider } = await deployVotingFixture();

    await expect(voting.connect(outsider).addCandidate("Carol Lee")).to.be.revertedWith(
      "Only owner can call this function"
    );

    await expect(voting.connect(outsider).whitelistVoter(outsider.address)).to.be.revertedWith(
      "Only owner can call this function"
    );
  });

  it("allows exactly one vote for a whitelisted voter", async function () {
    const { voting, voter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await expect(voting.connect(voter).vote(1)).to.emit(voting, "Voted").withArgs(voter.address, 1);

    const candidate = await voting.getCandidate(1);
    expect(candidate[1]).to.equal(1);
    expect(await voting.hasVoted(voter.address)).to.equal(true);

    await expect(voting.connect(voter).vote(1)).to.be.revertedWith("You have already voted");
  });

  it("rejects a voter that is not whitelisted", async function () {
    const { voting, outsider } = await deployVotingFixture();

    await expect(voting.connect(outsider).vote(0)).to.be.revertedWith("You are not allowed to vote");
  });

  it("prevents voting after the owner closes the election", async function () {
    const { voting, voter } = await deployVotingFixture();

    await voting.whitelistVoter(voter.address);
    await voting.endElection();

    await expect(voting.connect(voter).vote(0)).to.be.revertedWith("Election has ended");
  });

  it("returns all candidates for frontend rendering", async function () {
    const { voting } = await deployVotingFixture();

    const candidates = await voting.getAllCandidates();
    expect(candidates).to.have.length(2);
    expect(candidates[0].name).to.equal("Alice Johnson");
    expect(candidates[1].name).to.equal("Bob Smith");
  });
});
