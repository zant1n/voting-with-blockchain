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
    mapping(address => bool) public hasVoted;
    Candidate[] public candidates;
    address public admin;
    bool public votingActive;

    
    event VoteCast(address voter, uint candidateId);
    event VotingStatusChanged(bool isActive);
    event CandidateUpdated(uint candidateId, string name, string imgHash, string description);

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
        require(!hasVoted[msg.sender], "You can not double vote!");
        require(_candidateId < candidates.length, "Invalid candidate ID."); 

        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;
        
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

        votingActive = true;
        emit VotingStatusChanged(true);
    }

    function endVoting() public {
        require(msg.sender == admin, " only admin can end voting!");
        require(votingActive, "Voting is already inactive.");

        votingActive = false;
        emit VotingStatusChanged(false);
    }

}
