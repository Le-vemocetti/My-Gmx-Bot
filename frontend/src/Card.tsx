import { useState, useEffect } from 'react';

export default function Card() {
  const [balance, setBalance] = useState<{ address: string; balance: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/balance')
      .then(res => res.json())
      .then(data => setBalance(data));
  }, []);

  const handleEnter = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/api/enter', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
    setLoading(false);
  };

  const handleExit = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/api/exit', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-center">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">GMX Trading Bot UI</h1>
      <p className="text-sm text-gray-600 mb-6">Tailwind is working!</p>
      {balance && (
        <div className="mb-4 text-sm text-gray-700">
          <p><strong>Wallet:</strong> {balance.address}</p>
          <p><strong>ETH:</strong> {balance.balance}</p>
        </div>
      )}
      <div className="flex justify-center gap-4">
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleEnter}
          disabled={loading}
        >
          Enter Trade
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleExit}
          disabled={loading}
        >
          Exit Trade
        </button>
      </div>
    </div>
  );
}
