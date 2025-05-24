import { useEffect, useState } from "react";
declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletConnect = () => {
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    });
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
  };

  return (
    <div className="p-2">
      {account ? (
        <p>Connected: {account}</p>
      ) : (
        <button onClick={connectWallet}>🔌 Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletConnect;
