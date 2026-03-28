// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    bool public electionEnded;

    mapping(address => bool) public whitelist;
    mapping(address => bool) public hasVoted;

    Candidate[] private candidates;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterWhitelisted(address indexed voter);
    event Voted(address indexed voter, uint256 indexed candidateId);
    event ElectionClosed(uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenElectionActive() {
        require(!electionEnded, "Election has ended");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addCandidate(string calldata name) external onlyOwner whenElectionActive {
        require(bytes(name).length > 0, "Candidate name is required");

        uint256 candidateId = candidates.length;
        candidates.push(Candidate({name: name, voteCount: 0}));

        emit CandidateAdded(candidateId, name);
    }

    function whitelistVoter(address voter) external onlyOwner whenElectionActive {
        require(voter != address(0), "Invalid voter address");
        require(!whitelist[voter], "Voter already whitelisted");

        whitelist[voter] = true;

        emit VoterWhitelisted(voter);
    }

    function vote(uint256 candidateId) external whenElectionActive {
        require(whitelist[msg.sender], "You are not allowed to vote");
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateId < candidates.length, "Candidate does not exist");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount += 1;

        emit Voted(msg.sender, candidateId);
    }

    function endElection() external onlyOwner whenElectionActive {
        electionEnded = true;
        emit ElectionClosed(block.timestamp);
    }

    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 candidateId) external view returns (string memory name, uint256 voteCount) {
        require(candidateId < candidates.length, "Candidate does not exist");

        Candidate storage candidate = candidates[candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }
}
