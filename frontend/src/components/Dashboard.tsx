import React, { useEffect, useState } from 'react';
import './index.css';

interface ApiResponse<T = any> {
  message: string;
  timestamp?: number;
  data?: T;
}

const API = 'http://localhost:5000/api/bot';

const App: React.FC = () => {
  const [balance, setBalance] = useState<string>('Loading...');
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>('Loading...');
  const [tradeLog, setTradeLog] = useState<string[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [settingsTradeAmount, setSettingsTradeAmount] = useState('');
  const [leverage, setLeverage] = useState('');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchData = () => {
    fetch(`${API}/balance`).then(res => res.json()).then((data: ApiResponse<{ balance: string }>) => setBalance(data.message)).catch(() => setBalance('Error'));
    fetch(`${API}/bot-status`).then(res => res.json()).then((data: ApiResponse<{ running: boolean }>) => setBotRunning(data.message === 'true'));
    fetch(`${API}/last-action`).then(res => res.json()).then((data: ApiResponse) => setLastAction(`${data.message} at ${new Date(data.timestamp || 0).toLocaleTimeString()}`));
    fetch(`${API}/log`).then(res => res.json()).then((data: ApiResponse[]) => setTradeLog(data.map(entry => `${entry.message} @ ${new Date(entry.timestamp || 0).toLocaleTimeString()}`)));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const startBot = async () => {
    const res = await fetch(`${API}/start-bot`, { method: 'POST' });
    const data: ApiResponse = await res.json();
    alert(data.message);
  };

  const emergencyWithdraw = async () => {
    const res = await fetch(`${API}/emergency-withdraw`, { method: 'POST' });
    const data: ApiResponse = await res.json();
    alert(data.message);
  };

  const deposit = async () => {
    const res = await fetch(`${API}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: depositAmount }),
    });
    const data: ApiResponse = await res.json();
    alert(data.message);
  };

  const updateSettings = async () => {
    const res = await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeAmountETH: parseFloat(settingsTradeAmount),
        leverage: parseFloat(leverage),
      }),
    });
    const data: ApiResponse = await res.json();
    alert(data.message);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📈 GMX Trading Bot Dashboard</h1>
        <button
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
            <p><strong>Balance:</strong> {balance} ETH</p>
            <p><strong>Bot Status:</strong> {botRunning ? '✅ Running' : '⛔️ Stopped'}</p>
            <p><strong>Last Action:</strong> {lastAction}</p>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">📋 Trade Log</h2>
            {tradeLog.length === 0 ? <p>No recent trades</p> : (
              <ul className="list-disc pl-5 space-y-1">
                {tradeLog.map((log, i) => <li key={i}>{log}</li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">🟢 Controls</h3>
            <div className="space-x-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={startBot}>Start Bot</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={emergencyWithdraw}>Emergency Withdraw</button>
            </div>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">💰 Deposit</h3>
            <input
              type="text"
              className="w-full p-2 rounded mb-2 bg-white dark:bg-gray-700 border dark:border-gray-600"
              placeholder="Amount in ETH"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={deposit}>Deposit</button>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">⚙️ Settings</h3>
            <input
              type="text"
              className="w-full p-2 rounded mb-2 bg-white dark:bg-gray-700 border dark:border-gray-600"
              placeholder="Trade Amount (ETH)"
              value={settingsTradeAmount}
              onChange={(e) => setSettingsTradeAmount(e.target.value)}
            />
            <input
              type="text"
              className="w-full p-2 rounded mb-2 bg-white dark:bg-gray-700 border dark:border-gray-600"
              placeholder="Leverage"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
            />
            <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={updateSettings}>Update Settings</button>
          </div>

          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
            ⚠️ Manual trading has been disabled. Trades are now fully automated.
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

