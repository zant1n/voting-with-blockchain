"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCandidateImageUrl } from "@/utils/candidateMedia";
import { getCandidateImageUrl as getFallbackCandidateImageUrl } from "@/utils/candidateImages";
import { getVotingContract } from "@/utils/web3Setup";

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "number"
        ? value
        : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseCandidateResult(raw: unknown): {
  name: string;
  imgHash: string;
  description: string;
  voteCount: number;
} {
  const arr = Array.isArray(raw) ? raw : [];

  // Newer: (id, name, imgHash, description, voteCount)
  if (arr.length >= 5) {
    return {
      name: typeof arr[1] === "string" ? arr[1] : String(arr[1] ?? ""),
      imgHash: typeof arr[2] === "string" ? arr[2] : String(arr[2] ?? ""),
      description: typeof arr[3] === "string" ? arr[3] : String(arr[3] ?? ""),
      voteCount: toFiniteNumber(arr[4], 0)
    };
  }

  // Older: (id, name, imgHash, voteCount)
  if (arr.length === 4) {
    return {
      name: typeof arr[1] === "string" ? arr[1] : String(arr[1] ?? ""),
      imgHash: typeof arr[2] === "string" ? arr[2] : String(arr[2] ?? ""),
      description: "",
      voteCount: toFiniteNumber(arr[3], 0)
    };
  }

  return { name: "", imgHash: "", description: "", voteCount: 0 };
}

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
  const safeVoteCount = Number.isFinite(voteCount) ? voteCount : 0;
  const safeDescription = typeof description === "string" ? description : String(description ?? "");

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
      const num = toFiniteNumber(await contract.getNumCandidates(), 0);
      if (candidateId >= num) {
        setError("No candidate with this ID.");
        setLoading(false);
        return;
      }

      const rawCandidate = await contract.getCandidate(candidateId);
      const parsed = parseCandidateResult(rawCandidate);
      setName(parsed.name);
      setImgHash(parsed.imgHash);
      setDescription(parsed.description);
      setVoteCount(parsed.voteCount);
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
            <img
              src={imgHash ? getCandidateImageUrl(imgHash) : getFallbackCandidateImageUrl(candidateId)}
              alt={name}
              className="h-64 w-full object-cover"
            />
            <div className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Candidate #{candidateId}
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-700">
                Current votes: <span className="font-bold text-gray-900">{safeVoteCount}</span>
              </p>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">About</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {safeDescription.trim() ? safeDescription : "No description provided."}
                </p>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
