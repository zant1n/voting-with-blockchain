import { FormEvent, useState } from "react";

type AdminPanelProps = {
  isSubmitting: boolean;
  isVotingActive: boolean;
  onAddCandidate: (name: string, imgHash: string, description: string) => Promise<void>;
  onEditCandidate: (id: number, name: string, imgHash: string, description: string) => Promise<void>;
  onStartVoting: () => Promise<void>;
  onEndVoting: () => Promise<void>;
};

export default function AdminPanel({
  isSubmitting,
  isVotingActive,
  onAddCandidate,
  onEditCandidate,
  onStartVoting,
  onEndVoting
}: AdminPanelProps) {
  const [name, setName] = useState("");
  const [imgHash, setImgHash] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editImgHash, setEditImgHash] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      alert("Candidate name is required.");
      return;
    }

    await onAddCandidate(name.trim(), imgHash.trim(), description.trim());
    setName("");
    setImgHash("");
    setDescription("");
  };

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(editId);

    if (Number.isNaN(id) || id < 0) {
      alert("Valid candidate ID is required.");
      return;
    }

    if (!editName.trim()) {
      alert("Candidate name is required.");
      return;
    }

    await onEditCandidate(id, editName.trim(), editImgHash.trim(), editDescription.trim());
    setEditId("");
    setEditName("");
    setEditImgHash("");
    setEditDescription("");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
      <p className="mt-1 text-sm text-gray-600">Control voting lifecycle and manage candidates.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStartVoting}
          disabled={isSubmitting || isVotingActive}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          Start Voting
        </button>
        <button
          type="button"
          onClick={onEndVoting}
          disabled={isSubmitting || !isVotingActive}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          End Voting
        </button>
        <span className="self-center text-sm font-semibold text-gray-700">
          Status: {isVotingActive ? "Active" : "Inactive"}
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Candidate name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
          />
          <input
            type="text"
            value={imgHash}
            onChange={(event) => setImgHash(event.target.value)}
            placeholder="Image URL or IPFS hash"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
          />
          <button
            type="submit"
            disabled={isSubmitting || isVotingActive}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Submitting..." : "Add Candidate"}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Candidate description (shown on the Info page)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
        />
      </form>

      <form onSubmit={onEditSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="number"
            min={0}
            value={editId}
            onChange={(event) => setEditId(event.target.value)}
            placeholder="Candidate ID"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
          />
          <input
            type="text"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            placeholder="New candidate name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
          />
          <input
            type="text"
            value={editImgHash}
            onChange={(event) => setEditImgHash(event.target.value)}
            placeholder="New image URL or IPFS hash"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
          />
          <button
            type="submit"
            disabled={isSubmitting || isVotingActive}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSubmitting ? "Submitting..." : "Edit Candidate"}
          </button>
        </div>
        <textarea
          value={editDescription}
          onChange={(event) => setEditDescription(event.target.value)}
          placeholder="New description (Info page)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-200 focus:ring"
        />
      </form>
    </section>
  );
}
