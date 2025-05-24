import { useEffect, useState } from 'react';

type Props = {
  walletAddress: string | null;
  loading: boolean;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function BotControls({ walletAddress, loading }: Props) {
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Fetching status...');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bot/bot-status`);
      const data = await res.json();
      setBotRunning(data.running);
      setStatusMessage(data.running ? 'Bot is Active' : 'Bot is Paused');
    } catch (err) {
      console.error(err);
      setStatusMessage('Error fetching bot status');
    }
  };

  const toggleBot = async () => {
    const action = botRunning ? 'pause' : 'resume';
    try {
      const res = await fetch(`${API_URL}/api/bot/${action}`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchStatus();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} the bot.`);
    }
  };

  const forceWithdraw = async () => {
    if (!walletAddress) return alert('Connect wallet first.');
    try {
      const res = await fetch(`${API_URL}/api/bot/force-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      alert(data.message || 'Force withdrawal triggered');
    } catch (err) {
      console.error(err);
      alert('Error triggering forced withdrawal');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Bot Controls</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">{statusMessage}</p>

      <div className="space-y-4">
        <button
          onClick={toggleBot}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition-colors duration-200 ${
            botRunning
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-yellow-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300 cursor-not-allowed'
          }`}
        >
          {loading ? (botRunning ? 'Pausing...' : 'Resuming...') : botRunning ? 'Pause Bot' : 'Resume Bot'}
        </button>

        <button
          onClick={forceWithdraw}
          disabled={loading || !walletAddress}
          className="w-full py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? 'Processing...' : 'Emergency Withdraw'}
        </button>
      </div>
    </div>
  );
}
