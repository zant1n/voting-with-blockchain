"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCandidateImageUrl } from "@/utils/candidateMedia";
import { getVotingContract } from "@/utils/web3Setup";

export default function CandidateInfoPage() {
  const params = useParams();
  const rawId = params.id;
  const candidateId =
    typeof rawId === "string" ? Number.parseInt(rawId, 10) : Number.NaN;

  const [name, setName] = useState("");
  const [imgHash, setImgHash] = useState("");
  const [description, setDescription] = useState("");
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Number.isNaN(candidateId) || candidateId < 0) {
      setError("Invalid candidate ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const contract = await getVotingContract();
      const num = Number(await contract.getNumCandidates());
      if (candidateId >= num) {
        setError("No candidate with this ID.");
        setLoading(false);
        return;
      }

      const [, n, img, desc, votes] = await contract.getCandidate(candidateId);
      setName(n);
      setImgHash(img);
      setDescription(desc);
      setVoteCount(Number(votes));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}
        {!loading && !error && (
          <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <img src={getCandidateImageUrl(imgHash)} alt={name} className="h-64 w-full object-cover" />
            <div className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Candidate #{candidateId}
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-700">
                Current votes: <span className="font-bold text-gray-900">{voteCount}</span>
              </p>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">About</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {description.trim() ? description : "No description provided."}
                </p>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
