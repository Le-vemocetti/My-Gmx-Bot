import React from 'react';
import { ethers } from 'ethers';
import botABI from '../abi/botABI.json';

type Props = {
  setAddress: (address: string) => void;
  setContract: (contract: ethers.Contract) => void;
};

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const WalletConnect: React.FC<Props> = ({ setAddress, setContract }) => {
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, botABI, signer);

      setAddress(address);
      setContract(contract);

      console.log('✅ Wallet connected:', address);
    } catch (err) {
      console.error('Wallet connection error:', err);
      alert('Failed to connect wallet.');
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={connectWallet}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Connect Wallet
      </button>
    </div>
  );
};

export default WalletConnect;
