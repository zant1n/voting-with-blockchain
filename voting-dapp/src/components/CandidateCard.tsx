import { useState } from "react";
import Link from "next/link";
import { getCandidateImageUrl } from "@/utils/candidateMedia";
import { getCandidateImageUrl as getFallbackCandidateImageUrl } from "@/utils/candidateImages";

type CandidateCardProps = {
  id: number;
  name: string;
  imgHash: string;
  voteCount: number;
  isVoting: boolean;
  walletConnected: boolean;
  isVotingActive: boolean;
  onVote: (candidateId: number) => Promise<void>;
};

export default function CandidateCard({
  id,
  name,
  imgHash,
  voteCount,
  isVoting,
  walletConnected,
  isVotingActive,
  onVote
}: CandidateCardProps) {
  const [imgError, setImgError] = useState(false);
  const safeVoteCount = Number.isFinite(voteCount) ? voteCount : 0;
  const imageUrl = imgHash ? getCandidateImageUrl(imgHash) : getFallbackCandidateImageUrl(id);

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
          <span className="text-3xl font-bold text-blue-600">{safeVoteCount}</span>
          <span className="text-gray-500 ml-1">votes</span>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => onVote(id)}
            disabled={!walletConnected || !isVotingActive || isVoting}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
              walletConnected && isVotingActive && !isVoting
                ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {!walletConnected
              ? "Connect Wallet"
              : !isVotingActive
                ? "Voting Closed"
                : isVoting
                  ? "Voting..."
                  : "Vote Now"}
          </button>
          <Link
            href={`/candidate/${id}`}
            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View Info
          </Link>
        </div>
      </div>
    </div>
  );
}
