import { useState } from 'react';

export default function DepositForm() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount) return alert('Enter an amount');
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    alert(data.message || 'Deposit successful');
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h2 className="text-xl font-semibold mb-2">Add Liquidity</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="border p-2 rounded w-full mb-2"
      />
      <button
        onClick={handleDeposit}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  );
}
