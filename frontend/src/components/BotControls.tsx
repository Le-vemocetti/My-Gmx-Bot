import { useEffect, useState, useRef } from 'react';

type Props = {
  walletAddress: string | null;
  loading: boolean;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function BotControls({ walletAddress, loading }: Props) {
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Fetching status...');
  const [currentTrade, setCurrentTrade] = useState<null | {
    isLong: boolean;
    size: number;
    price: number;
    timestamp: number;
  }>(null);
  const [tradeLog, setTradeLog] = useState<{ message: string; timestamp: string }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(30);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAll();
    startCountdown();

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Countdown timer updates every second, resets to 30 on fetchAll
  const startCountdown = () => {
    setCountdown(30);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 30));
    }, 1000);
  };

  const fetchAll = async () => {
    await Promise.all([fetchStatus(), fetchCurrentTrade(), fetchTradeLog(), fetchCurrentPrice()]);
    setCountdown(30);
  };

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

  const fetchCurrentTrade = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bot/current-trade`);
      const data = await res.json();
      if (data.active) {
        setCurrentTrade(data);
      } else {
        setCurrentTrade(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTradeLog = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bot/log`);
      const data = await res.json();
      setTradeLog(data.slice(0, 10)); // Show last 10 logs
    } catch (err) {
      console.error(err);
    }
  };

  // For live PnL, get current price from your backend or public API (mock here)
  const fetchCurrentPrice = async () => {
    try {
      // Assuming your backend has /balance or some price endpoint
      // If not, you can fetch price from some public API or add one backend route
      // Here, just a mock example:
      const res = await fetch(`${API_URL}/api/bot/current-price`);
      const data = await res.json();
      setCurrentPrice(Number(data.price));
    } catch {
      setCurrentPrice(null);
    }
  };

  const toggleBot = async () => {
    const action = botRunning ? 'stop-bot' : 'start-bot';
    try {
      const res = await fetch(`${API_URL}/api/bot/${action}`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${botRunning ? 'stop' : 'start'} the bot.`);
    }
  };

  const forceWithdraw = async () => {
    if (!walletAddress) return alert('Connect wallet first.');
    try {
      const res = await fetch(`${API_URL}/api/bot/emergency-withdraw`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(data.message || 'Force withdrawal triggered');
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert('Error triggering forced withdrawal');
    }
  };

  const formatTime = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString();
  };

  // Calculate PnL %
  const calcPnL = () => {
    if (!currentTrade || currentPrice === null) return null;
    const diff = currentPrice - currentTrade.price;
    const pnl = currentTrade.isLong ? diff : -diff; // profit if long & price up, or short & price down
    const pnlPercent = (pnl / currentTrade.price) * 100;
    return pnlPercent.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Bot Controls</h2>
      <p className="mb-2 text-gray-700 dark:text-gray-300">{statusMessage}</p>

      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={fetchAll}
          disabled={loading}
          className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
        >
          Refresh
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Next update in: {countdown}s
        </span>
      </div>

      {currentTrade ? (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📈 Active Trade</h3>
          <p className="text-sm text-gray-800 dark:text-gray-300">
            Direction: <strong>{currentTrade.isLong ? 'Buy (Long)' : 'Sell (Short)'}</strong><br />
            Size: <strong>{currentTrade.size}</strong><br />
            Entry Price: <strong>${currentTrade.price.toFixed(2)}</strong><br />
            Time: <strong>{formatTime(currentTrade.timestamp)}</strong><br />
            {currentPrice !== null && (
              <>
                Current Price: <strong>${currentPrice.toFixed(2)}</strong><br />
                PnL: <strong className={calcPnL() && Number(calcPnL()) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {calcPnL()}%
                </strong>
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="mb-6 text-gray-600 dark:text-gray-400">No active trade</p>
      )}

      <div className="space-y-4 mb-6">
        <button
          onClick={toggleBot}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition-colors duration-200 ${
            botRunning
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-yellow-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300 cursor-not-allowed'
          }`}
        >
          {loading ? (botRunning ? 'Pausing...' : 'Starting...') : botRunning ? 'Pause Bot' : 'Start Bot'}
        </button>

        <button
          onClick={forceWithdraw}
          disabled={loading || !walletAddress}
          className="w-full py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? 'Processing...' : 'Emergency Withdraw'}
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">📝 Recent Trade Logs</h3>
        {tradeLog.length === 0 && <p className="text-gray-600 dark:text-gray-400">No logs available</p>}
        <ul className="text-sm text-gray-800 dark:text-gray-300">
          {tradeLog.map(({ message, timestamp }, i) => (
            <li key={i} className="mb-1">
              <span>{formatTime(timestamp)} - </span>
              <span>{message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
