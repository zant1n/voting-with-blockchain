import { useState } from 'react';
import { getCandidateImageUrl } from '@/utils/candidateMedia';

interface CandidateCardProps {
  id: number;
  name: string;
  imgHash: string;
  voteCount: number;
  onVote: (candidateId: number) => void;
  walletConnected: boolean;
  isVoting: boolean;
  isVotingActive: boolean;
}

export default function CandidateCard({
  id,
  name,
  imgHash,
  voteCount,
  onVote,
  walletConnected,
  isVoting,
  isVotingActive
}: CandidateCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getCandidateImageUrl(imgHash || id);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Profile Image Section */}
      <div className="relative h-48 bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
            <span className="text-5xl">🗳️</span>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-5 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>
        
        <div className="mb-4">
          <span className="text-3xl font-bold text-blue-600">{voteCount}</span>
          <span className="text-gray-500 ml-1">votes</span>
        </div>
        
        <button
          onClick={() => onVote(id)}
          disabled={!walletConnected || !isVotingActive || isVoting}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
            walletConnected && isVotingActive && !isVoting
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!walletConnected 
            ? 'Connect Wallet' 
            : !isVotingActive 
              ? 'Voting Closed' 
              : isVoting
                ? 'Submitting...'
                : 'Vote Now'}
        </button>
      </div>
    </div>
  );
}
