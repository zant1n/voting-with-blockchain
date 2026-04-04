import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
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
  voteCount: number;
};

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";

export const ADMIN_FALLBACK =
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

export async function getProvider(): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not available.");
  }

  return new BrowserProvider(window.ethereum);
}

export async function getConnectedAccount(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
  return accounts[0] || null;
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
  if (!accounts.length) {
    throw new Error("No account returned from wallet.");
  }

  return accounts[0];
}

export async function getVotingContract(signer?: JsonRpcSigner): Promise<Contract> {
  const provider = signer ? signer.provider : await getProvider();
  const code = await provider.getCode(CONTRACT_ADDRESS);

  if (!code || code === "0x") {
    throw new Error(
      `No contract code found at ${CONTRACT_ADDRESS}. Update NEXT_PUBLIC_CONTRACT_ADDRESS to the deployed Remix address.`
    );
  }

  if (signer) {
    return new Contract(CONTRACT_ADDRESS, contractABI, signer);
  }

  return new Contract(CONTRACT_ADDRESS, contractABI, provider);
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
