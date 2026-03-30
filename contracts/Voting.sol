// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct AuditRecord {
        uint8 actionType;
        address actor;
        address subject;
        uint256 refId;
        uint256 timestamp;
        uint256 blockNumber;
    }

    uint8 private constant ACTION_CANDIDATE_ADDED = 1;
    uint8 private constant ACTION_VOTER_WHITELISTED = 2;
    uint8 private constant ACTION_ELECTION_STARTED = 3;
    uint8 private constant ACTION_VOTE_CAST = 4;
    uint8 private constant ACTION_ELECTION_ENDED = 5;
    uint8 private constant ACTION_ELECTION_ROUND_RESET = 6;

    address public owner;
    bool public electionStarted;
    bool public electionEnded;
    uint256 public electionRound;
    uint256 public electionStartTimestamp;
    uint256 public electionStartBlock;
    uint256 public electionEndTimestamp;
    uint256 public whitelistedVoterCount;
    uint256 public snapshotVoterCount;
    uint256 public totalVotesCast;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) private lastVotedRound;
    mapping(address => uint256) public whitelistBlock;

    Candidate[] private candidates;
    AuditRecord[] private auditTrail;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterWhitelisted(address indexed voter);
    event ElectionStarted(uint256 timestamp, uint256 startBlock, uint256 snapshotVoters);
    event Voted(address indexed voter, uint256 indexed candidateId);
    event ElectionClosed(uint256 timestamp);
    event ElectionRoundReset(uint256 indexed nextRound);
    event AuditTrailRecorded(
        uint8 indexed actionType,
        address indexed actor,
        address indexed subject,
        uint256 refId,
        uint256 timestamp,
        uint256 blockNumber
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier beforeElectionStart() {
        require(!electionStarted || electionEnded, "Election parameters are frozen");
        _;
    }

    modifier whenElectionOpen() {
        require(electionStarted, "Election has not started");
        require(!electionEnded, "Election has ended");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addCandidate(string calldata name) external onlyOwner beforeElectionStart {
        require(bytes(name).length > 0, "Candidate name is required");

        uint256 candidateId = candidates.length;
        candidates.push(Candidate({name: name, voteCount: 0}));

        _recordAudit(ACTION_CANDIDATE_ADDED, msg.sender, address(0), candidateId);
        emit CandidateAdded(candidateId, name);
    }

    function whitelistVoter(address voter) external onlyOwner beforeElectionStart {
        require(voter != address(0), "Invalid voter address");
        require(!whitelist[voter], "Voter already whitelisted");

        whitelist[voter] = true;
        whitelistBlock[voter] = block.number;
        whitelistedVoterCount += 1;

        _recordAudit(ACTION_VOTER_WHITELISTED, msg.sender, voter, 0);
        emit VoterWhitelisted(voter);
    }

    function startElection() external onlyOwner beforeElectionStart {
        require(candidates.length > 0, "At least one candidate required");

        if (electionEnded) {
            _prepareNextElectionRound();
        }

        electionStarted = true;
        electionRound += 1;
        electionStartTimestamp = block.timestamp;
        electionStartBlock = block.number;
        snapshotVoterCount = whitelistedVoterCount;

        _recordAudit(ACTION_ELECTION_STARTED, msg.sender, address(0), snapshotVoterCount);
        emit ElectionStarted(block.timestamp, block.number, snapshotVoterCount);
    }

    function vote(uint256 candidateId) external whenElectionOpen {
        require(whitelist[msg.sender], "You are not allowed to vote");
        require(whitelistBlock[msg.sender] <= electionStartBlock, "Voter not in election snapshot");
        require(lastVotedRound[msg.sender] != electionRound, "You have already voted");
        require(candidateId < candidates.length, "Candidate does not exist");

        lastVotedRound[msg.sender] = electionRound;
        candidates[candidateId].voteCount += 1;
        totalVotesCast += 1;

        _recordAudit(ACTION_VOTE_CAST, msg.sender, msg.sender, candidateId);
        emit Voted(msg.sender, candidateId);
    }

    function endElection() external onlyOwner whenElectionOpen {
        electionEnded = true;
        electionEndTimestamp = block.timestamp;

        _recordAudit(ACTION_ELECTION_ENDED, msg.sender, address(0), totalVotesCast);
        emit ElectionClosed(block.timestamp);
    }

    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    function hasVoted(address voter) external view returns (bool) {
        return electionRound > 0 && lastVotedRound[voter] == electionRound;
    }

    function getCandidate(uint256 candidateId) external view returns (string memory name, uint256 voteCount) {
        require(candidateId < candidates.length, "Candidate does not exist");

        Candidate storage candidate = candidates[candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getAuditTrailCount() external view returns (uint256) {
        return auditTrail.length;
    }

    function getAuditRecord(uint256 index)
        external
        view
        returns (uint8 actionType, address actor, address subject, uint256 refId, uint256 timestamp, uint256 blockNumber)
    {
        require(index < auditTrail.length, "Audit record does not exist");

        AuditRecord storage record = auditTrail[index];
        return (
            record.actionType,
            record.actor,
            record.subject,
            record.refId,
            record.timestamp,
            record.blockNumber
        );
    }

    function getElectionSummary()
        external
        view
        returns (
            bool started,
            bool ended,
            uint256 startTimestamp,
            uint256 endTimestamp,
            uint256 votersAtSnapshot,
            uint256 votesCast,
            uint256 candidateCount,
            uint256 auditRecordCount
        )
    {
        return (
            electionStarted,
            electionEnded,
            electionStartTimestamp,
            electionEndTimestamp,
            snapshotVoterCount,
            totalVotesCast,
            candidates.length,
            auditTrail.length
        );
    }

    function _recordAudit(uint8 actionType, address actor, address subject, uint256 refId) private {
        AuditRecord memory record = AuditRecord({
            actionType: actionType,
            actor: actor,
            subject: subject,
            refId: refId,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        auditTrail.push(record);
        emit AuditTrailRecorded(actionType, actor, subject, refId, record.timestamp, record.blockNumber);
    }

    function _prepareNextElectionRound() private {
        electionEnded = false;
        electionEndTimestamp = 0;
        electionStartTimestamp = 0;
        electionStartBlock = 0;
        snapshotVoterCount = 0;
        totalVotesCast = 0;

        for (uint256 index = 0; index < candidates.length; index++) {
            candidates[index].voteCount = 0;
        }

        uint256 nextRound = electionRound + 1;
        _recordAudit(ACTION_ELECTION_ROUND_RESET, msg.sender, address(0), nextRound);
        emit ElectionRoundReset(nextRound);
    }

}
