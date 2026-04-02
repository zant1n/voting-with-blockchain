// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Voting { 
    
    // 1. Define Candidate
    struct Candidate {
        uint id;
        string name;
        string imgHash;
        uint8 voteCount;
    }

    

    //  State Variables
    mapping(address => bool) public hasVoted;
    Candidate[] public candidates;
    address public admin;

    
    event VoteCast(address voter, uint candidateId);

    //  Constructor
    constructor(string[] memory _candidateNames) {
        admin = msg.sender;
        
        for(uint i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: _candidateNames[i],
                imgHash: "", 
                voteCount: 0
            })); 
        }
    }

    //  Vote Function
    function vote(uint _candidateId) public { 
        // Fixed the extra ');' and trailing commas in the require statements
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
    function getCandidate(uint _candidateId) public view returns (uint, string memory, string memory, uint8) {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        Candidate memory c = candidates[_candidateId];
        
        return (c.id, c.name, c.imgHash, c.voteCount);
    }
    function getTotalVotes()public view returns (uint){
        uint TotalVotes = 0;
        for(uint i=0;i<candidates.length;i++){
            TotalVotes += candidates[i].voteCount;
        }
        return TotalVotes;
    }
    function addCandudate( string memory _name, string memory _imgHash) public {
        require(msg.sender == admin, " only admin can add candidates!");
        uint newCandidateId = candidates.length;
        candidates.push(Candidate(
            newCandidateId, 
            _name, 
            _imgHash, 
            0));
    }

}