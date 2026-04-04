import { FormEvent, useState } from "react";

type AdminPanelProps = {
  isSubmitting: boolean;
  onAddCandidate: (name: string, imgHash: string) => Promise<void>;
};

export default function AdminPanel({ isSubmitting, onAddCandidate }: AdminPanelProps) {
  const [name, setName] = useState("");
  const [imgHash, setImgHash] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      alert("Candidate name is required.");
      return;
    }

    await onAddCandidate(name.trim(), imgHash.trim());
    setName("");
    setImgHash("");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
      <p className="mt-1 text-sm text-gray-600">Add a new candidate to the ballot.</p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
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
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? "Submitting..." : "Add Candidate"}
        </button>
      </form>
    </section>
  );
}
