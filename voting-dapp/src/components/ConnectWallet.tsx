'use client';
import { useState } from 'react';

interface ConnectWalletProps {
  setAccount: (account: string) => void;
  setWeb3: (web3: unknown) => void;
}

export default function ConnectWallet({ setAccount, setWeb3 }: ConnectWalletProps) {
  const [address, setAddress] = useState<string>('');

  const connect = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = (await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })) as string[];
        setWeb3(null);
        setAccount(accounts[0]);
        setAddress(`${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`);
      } catch (error) {
        console.error('Error connecting:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <button 
      onClick={connect}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {address ? `Connected: ${address}` : 'Connect Wallet'}
    </button>
  );
}
