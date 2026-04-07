"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPanel from "@/components/AdminPanel";
import CandidateCard from "@/components/CandidateCard";
import Navbar from "@/components/Navbar";
import {
  ADMIN_FALLBACK,
  Candidate,
  connectWallet,
  ensureExpectedNetwork,
  getConnectedAccount,
  getProvider,
  hasMetaMask,
  getVotingContract,
  onWalletEvents,
  switchWalletAccount
} from "@/utils/web3Setup";

type LastElectionPanel = {
  headline: string;
  rows: { candidateId: number; name: string; votes: number }[];
};

const DOUBLE_VOTE_MESSAGE = "You have already voted!!";

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "number"
        ? value
        : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

async function hasVotedForCurrentElection(contract: unknown, account: string): Promise<boolean> {
  const c = contract as Record<string, unknown>;
  const hasVotedThisElection = c["hasVotedThisElection"];
  if (typeof hasVotedThisElection === "function") {
    try {
      return Boolean(await (hasVotedThisElection as (addr: string) => Promise<unknown>)(account));
    } catch {
      // ABI might include method that deployed contract doesn't implement; fall back below.
    }
  }

  const hasVoted = c["hasVoted"];
  if (typeof hasVoted === "function") {
    try {
      return Boolean(await (hasVoted as (addr: string) => Promise<unknown>)(account));
    } catch {
      // If this also fails, skip pre-check and let the vote tx tell us.
    }
  }

  return false;
}

function parseCandidateResult(raw: unknown): {
  id: number;
  name: string;
  imgHash: string;
  description: string;
  voteCount: number;
} {
  const arr = Array.isArray(raw) ? raw : [];

  // Newer contract: (id, name, imgHash, description, voteCount)
  if (arr.length >= 5) {
    return {
      id: toFiniteNumber(arr[0], 0),
      name: typeof arr[1] === "string" ? arr[1] : String(arr[1] ?? ""),
      imgHash: typeof arr[2] === "string" ? arr[2] : String(arr[2] ?? ""),
      description: typeof arr[3] === "string" ? arr[3] : String(arr[3] ?? ""),
      voteCount: toFiniteNumber(arr[4], 0)
    };
  }

  // Older contract: (id, name, imgHash, voteCount)
  if (arr.length === 4) {
    return {
      id: toFiniteNumber(arr[0], 0),
      name: typeof arr[1] === "string" ? arr[1] : String(arr[1] ?? ""),
      imgHash: typeof arr[2] === "string" ? arr[2] : String(arr[2] ?? ""),
      description: "",
      voteCount: toFiniteNumber(arr[3], 0)
    };
  }

  return { id: 0, name: "", imgHash: "", description: "", voteCount: 0 };
}

function winnerAnnouncementFromEvent(winnerIds: number[], maxVotes: number, names: string[]): string {
  if (winnerIds.length === 0) {
    return "Voting ended. There were no candidates on the ballot.";
  }
  const voteWord = maxVotes === 1 ? "vote" : "votes";
  if (names.length === 1) {
    return `Winner: ${names[0]} with ${maxVotes} ${voteWord}.`;
  }
  return `It's a tie between ${names.length} candidates: ${names.join(", ")} (${maxVotes} ${voteWord} each).`;
}

function isOpaqueCallFailure(message: string): boolean {
  return (
    message.includes("missing revert data") ||
    (message.includes("CALL_EXCEPTION") && message.includes("estimateGas"))
  );
}

function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Wrong network in MetaMask")) {
    return "MetaMask network mismatch. Please approve the network switch prompt (Ganache Local, chainId 1337), then try again.";
  }
  if (message.includes("No contract code found")) {
    return "Contract address has no code on the current wallet network. Use the latest Remix address for this chain in .env.local, then restart npm run dev.";
  }
  if (message.includes("Voting is not active")) {
    return "Voting is currently inactive. Ask admin to start voting first.";
  }
  if (message.includes("Can not add candidates while voting is active")) {
    return "Can not add candidates while voting is active. End voting first.";
  }
  if (message.includes("Can not edit candidates while voting is active")) {
    return "Can not edit candidates while voting is active. End voting first.";
  }
  if (message.includes("You can not double vote") || message.includes("already voted")) {
    return DOUBLE_VOTE_MESSAGE;
  }
  return message;
}

export default function Home() {
  const [walletAvailable, setWalletAvailable] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [adminAddress, setAdminAddress] = useState<string>(ADMIN_FALLBACK);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isVotingActive, setIsVotingActive] = useState<boolean>(false);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState<boolean>(false);
  const [votingCandidateId, setVotingCandidateId] = useState<number | null>(null);
  const [lastElection, setLastElection] = useState<LastElectionPanel | null>(null);

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
      const [numCandidatesRaw, totalVotesRaw, chainAdmin, votingStatus] = await Promise.all([
        contract.getNumCandidates(),
        contract.getTotalVotes(),
        contract.admin().catch(() => ADMIN_FALLBACK),
        contract.votingActive().catch(() => false)
      ]);

      const numCandidates = toFiniteNumber(numCandidatesRaw, 0);
      setAdminAddress(chainAdmin || ADMIN_FALLBACK);
      setIsVotingActive(Boolean(votingStatus));
      setTotalVotes(toFiniteNumber(totalVotesRaw, 0));

      const loadedCandidates: Candidate[] = [];
      for (let i = 0; i < numCandidates; i += 1) {
        const rawCandidate = await contract.getCandidate(i);
        const parsed = parseCandidateResult(rawCandidate);
        loadedCandidates.push({
          id: parsed.id || i,
          name: parsed.name,
          imgHash: parsed.imgHash,
          description: parsed.description,
          voteCount: parsed.voteCount
        });
      }
      setCandidates(loadedCandidates);

      try {
        const snap = await contract.getLastElectionSnapshot();
        const counts = snap.counts as bigint[];
        const winners = snap.winners as bigint[];
        const maxVotes = toFiniteNumber(snap.maxVotes, 0);

        if (!counts.length) {
          setLastElection(null);
        } else {
          const n = Math.min(counts.length, loadedCandidates.length);
          const rows = [];
          for (let i = 0; i < n; i += 1) {
            rows.push({
              candidateId: i,
              name: loadedCandidates[i]?.name ?? `Candidate #${i}`,
              votes: toFiniteNumber(counts[i], 0)
            });
          }
          const winnerIds = winners.map((w) => toFiniteNumber(w, 0));
          const winnerNames = winnerIds.map(
            (wid) => loadedCandidates[wid]?.name ?? `Candidate #${wid}`
          );
          setLastElection({
            headline: winnerAnnouncementFromEvent(winnerIds, maxVotes, winnerNames),
            rows
          });
        }
      } catch {
        setLastElection(null);
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to load contract data: ${toFriendlyError(error)}`);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (!walletAvailable) {
      alert("MetaMask is not installed. Install MetaMask to vote or add candidates.");
      return;
    }

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
  }, [loadDashboardData, walletAvailable]);

  const handleVote = useCallback(
    async (candidateId: number) => {
      if (!account) {
        alert("Please connect MetaMask before voting.");
        return;
      }
      if (!isVotingActive) {
        alert("The election has not yet started");
        return;
      }

      setVotingCandidateId(candidateId);
      try {
        const provider = await getProvider();
        await ensureExpectedNetwork(provider);

        // Recreate provider/signer after chain switch to avoid stale network context.
        const refreshedProvider = await getProvider();
        const signer = await refreshedProvider.getSigner();
        const contract = await getVotingContract(signer);

        const alreadyVoted = await hasVotedForCurrentElection(contract, account);
        if (alreadyVoted) {
          alert(DOUBLE_VOTE_MESSAGE);
          return;
        }

        const tx = await contract.vote(candidateId);
        await tx.wait();

        await loadDashboardData();
      } catch (error) {
        const raw = error instanceof Error ? error.message : String(error);
        let message = toFriendlyError(error);
        if (message === raw && isOpaqueCallFailure(raw)) {
          try {
            const readContract = await getVotingContract();
            const voted = await readContract.hasVotedThisElection(account);
            if (voted) {
              message = DOUBLE_VOTE_MESSAGE;
            }
          } catch {
            // keep message
          }
        }
        alert(message);
      } finally {
        setVotingCandidateId(null);
      }
    },
    [account, isVotingActive, loadDashboardData]
  );

  const handleSwitchAccount = useCallback(async () => {
    if (!walletAvailable) {
      alert("MetaMask is not installed. Install MetaMask to vote or add candidates.");
      return;
    }

    setIsSwitching(true);
    try {
      const selected = await switchWalletAccount();
      setAccount(selected);
      await loadDashboardData();
    } catch (error) {
      alert(`Switch account failed: ${toFriendlyError(error)}`);
    } finally {
      setIsSwitching(false);
    }
  }, [loadDashboardData, walletAvailable]);

  const handleAddCandidate = useCallback(
    async (name: string, imgHash: string, description: string) => {
      if (!isAdmin) {
        alert("Only admin can add candidates.");
        return;
      }

      setIsAdminSubmitting(true);
      try {
        const provider = await getProvider();
        await ensureExpectedNetwork(provider);

        const refreshedProvider = await getProvider();
        const signer = await refreshedProvider.getSigner();
        const contract = await getVotingContract(signer);

        const tx = await contract.addCandidate(name, imgHash, description);
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

  const handleEditCandidate = useCallback(
    async (id: number, name: string, imgHash: string, description: string) => {
      if (!isAdmin) {
        alert("Only admin can edit candidates.");
        return;
      }

      setIsAdminSubmitting(true);
      try {
        const provider = await getProvider();
        await ensureExpectedNetwork(provider);
        const signer = await provider.getSigner();
        const contract = await getVotingContract(signer);

        const tx = await contract.editCandidate(id, name, imgHash, description);
        await tx.wait();

        await loadDashboardData();
      } catch (error) {
        alert(`Edit candidate failed: ${toFriendlyError(error)}`);
      } finally {
        setIsAdminSubmitting(false);
      }
    },
    [isAdmin, loadDashboardData]
  );

  const handleStartVoting = useCallback(async () => {
    if (!isAdmin) {
      alert("Only admin can start voting.");
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const provider = await getProvider();
      await ensureExpectedNetwork(provider);

      const refreshedProvider = await getProvider();
      const signer = await refreshedProvider.getSigner();
      const contract = await getVotingContract(signer);

      const tx = await contract.startVoting();
      await tx.wait();

      await loadDashboardData();
    } catch (error) {
      alert(`Start voting failed: ${toFriendlyError(error)}`);
    } finally {
      setIsAdminSubmitting(false);
    }
  }, [isAdmin, loadDashboardData]);

  const handleEndVoting = useCallback(async () => {
    if (!isAdmin) {
      alert("Only admin can end voting.");
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const provider = await getProvider();
      await ensureExpectedNetwork(provider);

      const refreshedProvider = await getProvider();
      const signer = await refreshedProvider.getSigner();
      const contract = await getVotingContract(signer);

      const tx = await contract.endVoting();
      await tx.wait();

      await loadDashboardData();
    } catch (error) {
      alert(`End voting failed: ${toFriendlyError(error)}`);
    } finally {
      setIsAdminSubmitting(false);
    }
  }, [isAdmin, loadDashboardData]);

  useEffect(() => {
    setWalletAvailable(hasMetaMask());
  }, []);

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
      <Navbar
        account={account}
        isConnecting={isConnecting}
        isSwitching={isSwitching}
        onConnect={handleConnect}
        onSwitchAccount={handleSwitchAccount}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Election Dashboard</h2>
              <p className="mt-2 text-sm text-gray-600">Total Votes Cast (current round)</p>
              <p className="mt-1 text-4xl font-black text-blue-600">{totalVotes}</p>
              <p className="mt-2 text-sm font-semibold text-gray-700">
                Voting Status: {isVotingActive ? "Active" : "Inactive"}
              </p>
              {!walletAvailable && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Read-only mode is active. Install MetaMask to vote and add candidates.
                </p>
              )}
              {walletAvailable && !account && (
                <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  Connect MetaMask to vote. Admin account can also add candidates.
                </p>
              )}
            </div>

            {lastElection && (
              <div className="w-full shrink-0 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5 shadow-inner lg:max-w-md">
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900">
                  Last election results
                </h3>
                <p className="mt-2 text-base font-semibold text-gray-900">{lastElection.headline}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vote count by candidate
                </p>
                <ul className="mt-2 divide-y divide-gray-200 border-t border-gray-200">
                  {lastElection.rows.map((row) => (
                    <li
                      key={row.candidateId}
                      className="flex items-center justify-between gap-3 py-2 text-sm text-gray-800"
                    >
                      <span className="font-medium">
                        #{row.candidateId} {row.name}
                      </span>
                      <span className="tabular-nums font-bold text-blue-700">{row.votes}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </header>

        {isAdmin && (
          <div className="mb-8">
            <AdminPanel
              isSubmitting={isAdminSubmitting}
              isVotingActive={isVotingActive}
              onAddCandidate={handleAddCandidate}
              onEditCandidate={handleEditCandidate}
              onStartVoting={handleStartVoting}
              onEndVoting={handleEndVoting}
            />
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
                walletConnected={Boolean(account)}
                isVotingActive={isVotingActive}
                onVote={handleVote}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
