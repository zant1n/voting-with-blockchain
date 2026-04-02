// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    enum ElectionState {
        Setup,
        Active,
        Closed
    }

    struct Candidate {
        uint256 id;
        string name;
        string manifesto;
        string imgHash;
        uint256 voteCount;
    }

    address public admin;
    string public electionTitle;
    string public electionDescription;
    ElectionState public electionState;
    bool public isVotingOpen;

    mapping(address => bool) public hasVoted;
    mapping(address => bool) public whitelistedVoters;
    Candidate[] public candidates;

    event ElectionCreated(string title, string description);
    event ElectionStarted();
    event ElectionClosed();
    event CandidateAdded(uint256 candidateId, string name);
    event VoterWhitelisted(address voter);
    event VoterRemoved(address voter);
    event VoteCast(address voter, uint256 candidateId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function.");
        _;
    }

    modifier onlyDuringSetup() {
        require(electionState == ElectionState.Setup, "Operation only allowed in setup state.");
        _;
    }

    modifier onlyDuringActiveElection() {
        require(electionState == ElectionState.Active && isVotingOpen, "Election is not active.");
        _;
    }

    constructor(string memory _title, string memory _description) {
        admin = msg.sender;
        electionTitle = _title;
        electionDescription = _description;
        electionState = ElectionState.Setup;
        isVotingOpen = false;

        emit ElectionCreated(_title, _description);
    }

    function addCandidate(
        string memory _name,
        string memory _manifesto,
        string memory _imgHash
    ) public onlyAdmin onlyDuringSetup {
        uint256 newCandidateId = candidates.length;
        candidates.push(
            Candidate({
                id: newCandidateId,
                name: _name,
                manifesto: _manifesto,
                imgHash: _imgHash,
                voteCount: 0
            })
        );

        emit CandidateAdded(newCandidateId, _name);
    }

    function addVoterToWhitelist(address _voter) public onlyAdmin onlyDuringSetup {
        require(_voter != address(0), "Invalid voter address.");
        whitelistedVoters[_voter] = true;

        emit VoterWhitelisted(_voter);
    }

    function addVotersToWhitelist(address[] calldata _voters) external onlyAdmin onlyDuringSetup {
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            require(voter != address(0), "Invalid voter address.");
            whitelistedVoters[voter] = true;
            emit VoterWhitelisted(voter);
        }
    }

    function removeVoterFromWhitelist(address _voter) external onlyAdmin onlyDuringSetup {
        whitelistedVoters[_voter] = false;
        emit VoterRemoved(_voter);
    }

    function startElection() external onlyAdmin onlyDuringSetup {
        require(candidates.length > 0, "At least one candidate is required.");
        electionState = ElectionState.Active;
        isVotingOpen = true;

        emit ElectionStarted();
    }

    function closeElection() external onlyAdmin {
        require(electionState == ElectionState.Active, "Election is not active.");
        electionState = ElectionState.Closed;
        isVotingOpen = false;

        emit ElectionClosed();
    }

    function vote(uint256 _candidateId) public onlyDuringActiveElection {
        require(whitelistedVoters[msg.sender], "You are not whitelisted to vote.");
        require(!hasVoted[msg.sender], "You can not double vote!");
        require(_candidateId < candidates.length, "Invalid candidate ID.");

        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;

        emit VoteCast(msg.sender, _candidateId);
    }

    function getNumCandidates() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _candidateId)
        public
        view
        returns (uint256, string memory, string memory, string memory, uint256)
    {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        Candidate memory candidate = candidates[_candidateId];

        return (
            candidate.id,
            candidate.name,
            candidate.manifesto,
            candidate.imgHash,
            candidate.voteCount
        );
    }

    function getTotalVotes() public view returns (uint256) {
        uint256 totalVotes = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            totalVotes += candidates[i].voteCount;
        }

        return totalVotes;
    }

    function isEligibleToVote(address _voter) public view returns (bool) {
        return whitelistedVoters[_voter] && !hasVoted[_voter] && electionState == ElectionState.Active && isVotingOpen;
    }
}
