type NavbarProps = {
  account: string | null;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
};

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Navbar({ account, isConnecting, onConnect }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Voting DApp</h1>
        <button
          type="button"
          onClick={onConnect}
          disabled={isConnecting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isConnecting ? "Connecting..." : account ? truncateAddress(account) : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
}
