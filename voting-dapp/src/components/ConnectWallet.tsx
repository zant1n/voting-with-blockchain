'use client';
import { useState } from 'react';
import Web3 from 'web3';
import { getWeb3 } from '@/lib/web3';

interface ConnectWalletProps {
  setAccount: (account: string) => void;
  setWeb3: (web3: Web3 | null) => void;
}

export default function ConnectWallet({ setAccount, setWeb3 }: ConnectWalletProps) {
  const [address, setAddress] = useState<string>('');

  const connect = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const web3Instance = getWeb3();
        setWeb3(web3Instance);
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
