import React, { useState } from 'react';

type ControlPanelProps = {
  onStatus?: (msg: string) => void;
};

export default function ControlPanel({ onStatus }: ControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = async (path: string, body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      onStatus?.(data.message);
    } catch (err: any) {
      setError(err.message);
      onStatus?.(`❌ ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white shadow rounded p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Bot Control Panel</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <button
          disabled={loading}
          onClick={() =>
            callAPI('trade', {
              isLong: true,
              acceptablePrice: 3000, // Placeholder, update with real value
              amount: 1,
            })
          }
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Execute Long Trade'}
        </button>

        <button
          disabled={loading}
          onClick={() => callAPI('withdraw')}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Emergency Withdraw'}
        </button>
      </div>
    </div>
  );
}
