import { useEffect, useState } from 'react';

const StatusCard = () => {
  const [status, setStatus] = useState<string>('Loading...');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bot/bot-status');
      const data = await res.json();
      // Ensure we check that the status is a string and it's not undefined
      setStatus(data.running ? 'Bot is Active' : 'Bot is Paused');
    } catch (err) {
      console.error('Error fetching bot status:', err);
      setStatus('Error fetching status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, []);

  // Ensure that status is not undefined or null before applying toLowerCase
  const displayStatus = status ? status : 'No status available';

  return (
    <div className="bg-white shadow-xl rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Bot Status</h2>
      <p className={`text-xl ${loading ? 'text-gray-500' : displayStatus.toLowerCase() === 'bot is active' ? 'text-green-600' : 'text-red-600'}`}>
        {loading ? 'Loading...' : displayStatus}
      </p>
    </div>
  );
};

export default StatusCard;

