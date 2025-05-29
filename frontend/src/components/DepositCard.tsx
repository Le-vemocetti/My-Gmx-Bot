import React, { useEffect, useState } from 'react';

interface DepositCardProps {
  address: string | null;
  onSuccess: () => void;
}

const DepositCard: React.FC<DepositCardProps> = ({ address, onSuccess }) => {
  const [ethAmount, setEthAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [depositedAmount, setDepositedAmount] = useState<number>(0); // ✅ Added

  const MIN_USD = 20;
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch ETH price on load
  useEffect(() => {
    fetchEthPrice();
  }, []);

  const fetchEthPrice = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await res.json();
      setEthPrice(data.ethereum.usd);
    } catch (err) {
      console.error('Error fetching ETH price:', err);
    }
  };

  // ✅ Extracted fetchDeposit so we can reuse it
  const fetchDeposit = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/api/deposit/${address}`);
      const data = await res.json();
      setDepositedAmount(data.amount || 0);
    } catch (err) {
      console.error('Failed to fetch deposit amount', err);
    }
  };

  useEffect(() => {
    fetchDeposit();
  }, [address]);

  const handleDeposit = async () => {
    if (!address || ethPrice === null) return;

    const ethValue = parseFloat(ethAmount);
    if (isNaN(ethValue) || ethValue <= 0) {
      alert('Please enter a valid ETH amount');
      return;
    }

    const minEth = MIN_USD / ethPrice;
    if (ethValue < minEth) {
      alert(`Minimum deposit is $${MIN_USD} (~${minEth.toFixed(4)} ETH)`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount: ethAmount }),
      });

      const data = await res.json();
      alert(data.message || 'Deposit successful');
      setEthAmount(''); // ✅ clear input
      await fetchDeposit(); // ✅ refresh deposited amount
      onSuccess(); // ✅ notify parent
    } catch (err) {
      console.error('Deposit error:', err);
      alert('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const minEth = ethPrice ? (MIN_USD / ethPrice).toFixed(4) : null;

  return (
    <div className="bg-white shadow-xl rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Deposit ETH</h2>
      {!address ? (
        <p className="text-gray-500">Please connect your wallet first.</p>
      ) : (
        <>
          <label className="block text-gray-700 mb-2">Amount (ETH):</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="w-full p-2 mb-4 border rounded-md"
            placeholder="Enter ETH amount"
          />
          <button
            disabled={loading || ethPrice === null}
            onClick={handleDeposit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {loading ? 'Depositing...' : 'Deposit ETH'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            {ethPrice === null
              ? 'Fetching ETH price...'
              : `Minimum deposit: $${MIN_USD} (~${minEth} ETH)`}
          </p>
          <p className="text-sm text-green-700 mt-1">
            Current Deposit: {depositedAmount.toFixed(4)} ETH
          </p>
        </>
      )}
    </div>
  );
};

export default DepositCard;
