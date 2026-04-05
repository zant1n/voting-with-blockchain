// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
// Keep compiler below 0.8.20 for broad Ganache compatibility (avoids PUSH0 opcode).
pragma solidity <0.8.20;

contract Voting { 
    
    // 1. Define Candidate
    struct Candidate {
        uint id;
        string name;
        string imgHash;
        string description;
        uint8 voteCount;
    }

    

    //  State Variables
    /// @notice Increments when an election ends so the same wallet can vote again in the next round.
    uint256 public electionId = 1;
    mapping(address => uint256) public voterElectionId;
    Candidate[] public candidates;
    address public admin;
    bool public votingActive;

    /// @notice Snapshot after the last `endVoting` (cleared when the next `startVoting` runs).
    uint8[] public lastEndedVoteCounts;
    uint256[] public lastEndedWinnerIds;
    uint8 public lastEndedMaxVotes;

    
    event VoteCast(address voter, uint candidateId);
    event VotingStatusChanged(bool isActive);
    event CandidateUpdated(uint candidateId, string name, string imgHash, string description);
    /// @notice Emitted when voting ends. `winnerIds` lists every candidate index tied for the highest vote count.
    event VotingEnded(uint256[] winnerIds, uint8 maxVoteCount, uint8[] finalVoteCounts);

    //  Constructor
    constructor(string[] memory _candidateNames) {
        admin = msg.sender;
        
        for(uint i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: _candidateNames[i],
                imgHash: "",
                description: "",
                voteCount: 0
            })); 
        }
    }

    //  Vote Function
    function vote(uint _candidateId) public { 
        // Fixed the extra ');' and trailing commas in the require statements
        require(votingActive, "Voting is not active.");
        require(voterElectionId[msg.sender] < electionId, "You can not double vote!");
        require(_candidateId < candidates.length, "Invalid candidate ID."); 

        candidates[_candidateId].voteCount++;
        voterElectionId[msg.sender] = electionId;
        
        emit VoteCast(msg.sender, _candidateId);
    }

    //  Get Number of Candidates
    function getNumCandidates() public view returns (uint) { 
        // Fixed typo: 'returns' instead of 'return', 'uint' instead of 'unit8'
        return candidates.length; 
    }

    //  Get Candidate Details
    function getCandidate(uint _candidateId) public view returns (uint, string memory, string memory, string memory, uint8) {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        Candidate memory c = candidates[_candidateId];
        
        return (c.id, c.name, c.imgHash, c.description, c.voteCount);
    }
    function getTotalVotes()public view returns (uint){
        uint TotalVotes = 0;
        for(uint i=0;i<candidates.length;i++){
            TotalVotes += candidates[i].voteCount;
        }
        return TotalVotes;
    }
    function addCandidate(string memory _name, string memory _imgHash, string memory _description) public {
        require(msg.sender == admin, " only admin can add candidates!");
        require(!votingActive, "Can not add candidates while voting is active.");
        uint newCandidateId = candidates.length;
        candidates.push(Candidate(
            newCandidateId, 
            _name, 
            _imgHash, 
            _description,
            0));
    }

    function editCandidate(uint _candidateId, string memory _name, string memory _imgHash, string memory _description) public {
        require(msg.sender == admin, " only admin can edit candidates!");
        require(!votingActive, "Can not edit candidates while voting is active.");
        require(_candidateId < candidates.length, "Invalid candidate ID.");

        Candidate storage candidate = candidates[_candidateId];
        candidate.name = _name;
        candidate.imgHash = _imgHash;
        candidate.description = _description;

        emit CandidateUpdated(_candidateId, _name, _imgHash, _description);
    }

    function startVoting() public {
        require(msg.sender == admin, " only admin can start voting!");
        require(!votingActive, "Voting is already active.");
        require(candidates.length > 0, "No candidates available.");

        delete lastEndedVoteCounts;
        delete lastEndedWinnerIds;
        lastEndedMaxVotes = 0;

        votingActive = true;
        emit VotingStatusChanged(true);
    }

    /// @notice Whether this address has already voted in the current election round.
    function hasVotedThisElection(address voter) public view returns (bool) {
        return voterElectionId[voter] >= electionId;
    }

    /// @notice Final tallies and winners from the last `endVoting` (empty until an election ends).
    function getLastElectionSnapshot()
        external
        view
        returns (uint8[] memory counts, uint256[] memory winners, uint8 maxVotes)
    {
        uint256 nc = lastEndedVoteCounts.length;
        uint256 nw = lastEndedWinnerIds.length;
        counts = new uint8[](nc);
        winners = new uint256[](nw);
        for (uint256 i = 0; i < nc; i++) {
            counts[i] = lastEndedVoteCounts[i];
        }
        for (uint256 j = 0; j < nw; j++) {
            winners[j] = lastEndedWinnerIds[j];
        }
        maxVotes = lastEndedMaxVotes;
    }

    function endVoting() public {
        require(msg.sender == admin, " only admin can end voting!");
        require(votingActive, "Voting is already inactive.");

        uint8 maxVoteCount = 0;
        uint256 n = candidates.length;
        for (uint256 i = 0; i < n; i++) {
            if (candidates[i].voteCount > maxVoteCount) {
                maxVoteCount = candidates[i].voteCount;
            }
        }

        uint256[] memory idBuffer = new uint256[](n);
        uint256 winnerCount = 0;
        for (uint256 j = 0; j < n; j++) {
            if (candidates[j].voteCount == maxVoteCount) {
                idBuffer[winnerCount] = j;
                winnerCount++;
            }
        }

        uint256[] memory winnerIds = new uint256[](winnerCount);
        for (uint256 k = 0; k < winnerCount; k++) {
            winnerIds[k] = idBuffer[k];
        }

        uint8[] memory finalVoteCounts = new uint8[](n);
        for (uint256 t = 0; t < n; t++) {
            finalVoteCounts[t] = candidates[t].voteCount;
        }

        delete lastEndedVoteCounts;
        delete lastEndedWinnerIds;
        for (uint256 u = 0; u < n; u++) {
            lastEndedVoteCounts.push(finalVoteCounts[u]);
        }
        for (uint256 v = 0; v < winnerCount; v++) {
            lastEndedWinnerIds.push(winnerIds[v]);
        }
        lastEndedMaxVotes = maxVoteCount;

        votingActive = false;
        emit VotingStatusChanged(false);
        emit VotingEnded(winnerIds, maxVoteCount, finalVoteCounts);

        for (uint256 z = 0; z < n; z++) {
            candidates[z].voteCount = 0;
        }
        electionId++;
    }

}
