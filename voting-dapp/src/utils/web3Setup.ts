import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  type InterfaceAbi
} from "ethers";
import contractABI from "./contractABI.json";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (eventName: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export type Candidate = {
  id: number;
  name: string;
  imgHash: string;
  description: string;
  voteCount: number;
};

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";

export const ADMIN_FALLBACK =
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

export const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "1337");

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

function getContractAbi(): unknown[] {
  const raw = contractABI as unknown;

  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === "object" && "abi" in raw) {
    const abi = (raw as { abi?: unknown }).abi;
    if (Array.isArray(abi)) {
      return abi;
    }
  }

  throw new Error("Invalid contract ABI format. Rebuild and sync contractABI.json.");
}

function getReadProvider(): AbstractProvider {
  // Always read from configured RPC to keep dashboard stable even if wallet is on another network.
  return new JsonRpcProvider(RPC_URL);
}

export function hasMetaMask(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function getProvider(): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Install it to vote or add candidates.");
  }

  return new BrowserProvider(window.ethereum, "any");
}

export async function getConnectedAccount(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
  return accounts[0] || null;
}

function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export async function ensureExpectedNetwork(provider: BrowserProvider): Promise<void> {
  if (!EXPECTED_CHAIN_ID) {
    return;
  }

  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  if (currentChainId === EXPECTED_CHAIN_ID) {
    return;
  }

  const expectedHex = toHexChainId(EXPECTED_CHAIN_ID);

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: expectedHex }]);
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: expectedHex,
          chainName: "Ganache Local",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: [RPC_URL]
        }
      ]);
      return;
    }
    throw error;
  }
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  await ensureExpectedNetwork(provider);
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
  if (!accounts.length) {
    throw new Error("No account returned from wallet.");
  }

  return accounts[0];
}

export async function switchWalletAccount(): Promise<string> {
  const provider = await getProvider();
  await ensureExpectedNetwork(provider);

  await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];

  if (!accounts.length) {
    throw new Error("No account selected.");
  }

  return accounts[0];
}

export async function getVotingContract(signer?: JsonRpcSigner): Promise<Contract> {
  const abi = getContractAbi() as InterfaceAbi;
  const provider: AbstractProvider = signer ? signer.provider : getReadProvider();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (signer && EXPECTED_CHAIN_ID && chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong network in MetaMask. Current chainId=${chainId}, expected chainId=${EXPECTED_CHAIN_ID}. Switch to Ganache Local (1337).`
    );
  }

  const code = await provider.getCode(CONTRACT_ADDRESS);

  if (!code || code === "0x") {
    throw new Error(
      `No contract code found at ${CONTRACT_ADDRESS} on chainId=${chainId}. Update NEXT_PUBLIC_CONTRACT_ADDRESS to a deployed address on this same chain.`
    );
  }

  if (signer) {
    return new Contract(CONTRACT_ADDRESS, abi, signer);
  }

  return new Contract(CONTRACT_ADDRESS, abi, provider);
}

export function onWalletEvents(
  onAccountsChanged: (account: string | null) => void,
  onChainChanged: () => void
): () => void {
  if (typeof window === "undefined" || !window.ethereum) {
    return () => {};
  }

  const accountsHandler = (accounts: unknown) => {
    const list = Array.isArray(accounts) ? (accounts as string[]) : [];
    onAccountsChanged(list[0] || null);
  };

  window.ethereum.on("accountsChanged", accountsHandler);
  window.ethereum.on("chainChanged", onChainChanged);

  return () => {
    if (!window.ethereum) {
      return;
    }
    window.ethereum.removeListener("accountsChanged", accountsHandler);
    window.ethereum.removeListener("chainChanged", onChainChanged);
  };
}
