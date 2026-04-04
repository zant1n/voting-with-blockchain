"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPanel from "@/components/AdminPanel";
import CandidateCard from "@/components/CandidateCard";
import Navbar from "@/components/Navbar";
import {
  ADMIN_FALLBACK,
  Candidate,
  connectWallet,
  getConnectedAccount,
  getProvider,
  getVotingContract,
  onWalletEvents
} from "@/utils/web3Setup";

function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("No contract code found")) {
    return "Contract address is not deployed on the current network. Please paste the latest Remix deployed address into .env.local.";
  }
  if (message.includes("You can not double vote") || message.includes("already voted")) {
    return "You have already voted!";
  }
  return message;
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [adminAddress, setAdminAddress] = useState<string>(ADMIN_FALLBACK);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState<boolean>(false);
  const [votingCandidateId, setVotingCandidateId] = useState<number | null>(null);

  const isAdmin = useMemo(() => {
    if (!account || !adminAddress) {
      return false;
    }
    return account.toLowerCase() === adminAddress.toLowerCase();
  }, [account, adminAddress]);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const contract = await getVotingContract();
      const [numCandidatesRaw, totalVotesRaw, chainAdmin] = await Promise.all([
        contract.getNumCandidates(),
        contract.getTotalVotes(),
        contract.admin().catch(() => ADMIN_FALLBACK)
      ]);

      const numCandidates = Number(numCandidatesRaw);
      setAdminAddress(chainAdmin || ADMIN_FALLBACK);
      setTotalVotes(Number(totalVotesRaw));

      const loadedCandidates: Candidate[] = [];
      for (let i = 0; i < numCandidates; i += 1) {
        const [id, name, imgHash, voteCount] = await contract.getCandidate(i);
        loadedCandidates.push({
          id: Number(id),
          name,
          imgHash,
          voteCount: Number(voteCount)
        });
      }
      setCandidates(loadedCandidates);
    } catch (error) {
      console.error(error);
      alert(`Failed to load contract data: ${toFriendlyError(error)}`);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connected = await connectWallet();
      setAccount(connected);
      await loadDashboardData();
    } catch (error) {
      alert(`Wallet connection failed: ${toFriendlyError(error)}`);
    } finally {
      setIsConnecting(false);
    }
  }, [loadDashboardData]);

  const handleVote = useCallback(
    async (candidateId: number) => {
      if (!account) {
        alert("Please connect MetaMask before voting.");
        return;
      }

      setVotingCandidateId(candidateId);
      try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contract = await getVotingContract(signer);

        const tx = await contract.vote(candidateId);
        await tx.wait();

        await loadDashboardData();
      } catch (error) {
        alert(toFriendlyError(error));
      } finally {
        setVotingCandidateId(null);
      }
    },
    [account, loadDashboardData]
  );

  const handleAddCandidate = useCallback(
    async (name: string, imgHash: string) => {
      if (!isAdmin) {
        alert("Only admin can add candidates.");
        return;
      }

      setIsAdminSubmitting(true);
      try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contract = await getVotingContract(signer);

        const tx = await contract.addCandidate(name, imgHash);
        await tx.wait();

        await loadDashboardData();
      } catch (error) {
        alert(`Add candidate failed: ${toFriendlyError(error)}`);
      } finally {
        setIsAdminSubmitting(false);
      }
    },
    [isAdmin, loadDashboardData]
  );

  useEffect(() => {
    const init = async () => {
      const connected = await getConnectedAccount();
      setAccount(connected);
      await loadDashboardData();
    };

    init().catch((error) => {
      console.error(error);
      setIsLoadingData(false);
    });
  }, [loadDashboardData]);

  useEffect(() => {
    const cleanup = onWalletEvents(
      (newAccount) => setAccount(newAccount),
      () => loadDashboardData().catch(() => undefined)
    );
    return cleanup;
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar account={account} isConnecting={isConnecting} onConnect={handleConnect} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Election Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Total Votes Cast</p>
          <p className="mt-1 text-4xl font-black text-blue-600">{totalVotes}</p>
        </header>

        {isAdmin && (
          <div className="mb-8">
            <AdminPanel isSubmitting={isAdminSubmitting} onAddCandidate={handleAddCandidate} />
          </div>
        )}

        {isLoadingData ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
            Loading candidates...
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                id={candidate.id}
                name={candidate.name}
                imgHash={candidate.imgHash}
                voteCount={candidate.voteCount}
                isVoting={votingCandidateId === candidate.id}
                onVote={handleVote}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
