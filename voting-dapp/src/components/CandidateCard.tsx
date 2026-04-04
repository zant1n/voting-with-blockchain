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

function getImageUrl(imgHash: string): string {
  if (!imgHash) {
    return "https://placehold.co/400x220/e5e7eb/111827?text=Candidate";
  }

  if (imgHash.startsWith("http://") || imgHash.startsWith("https://")) {
    return imgHash;
  }

  return `https://ipfs.io/ipfs/${imgHash}`;
}

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
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <img src={getImageUrl(imgHash)} alt={name} className="h-52 w-full object-cover" />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Candidate #{id}</p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">{name}</h3>
        </div>
        <p className="text-sm text-gray-700">
          Current votes: <span className="font-bold text-gray-900">{voteCount}</span>
        </p>
        <button
          type="button"
          disabled={isVoting || !walletConnected}
          onClick={() => onVote(id)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isVoting
            ? "Loading..."
            : walletConnected
              ? "Vote"
              : isVotingActive
                ? "Connect MetaMask to Vote"
                : "Voting Inactive"}
        </button>
      </div>
    </article>
  );
}
