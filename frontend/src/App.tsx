import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [balance, setBalance] = useState<string>('Loading...');
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>('Loading...');
  const [tradeLog, setTradeLog] = useState<string[]>([]);

  const [depositAmount, setDepositAmount] = useState('');
  const [leverage, setLeverage] = useState('');
  const [settingsTradeAmount, setSettingsTradeAmount] = useState('');

  const API = 'http://localhost:5000/api/bot';

  useEffect(() => {
    fetch(`${API}/balance`)
      .then(res => res.json())
      .then(data => setBalance(data.balance))
      .catch(() => setBalance('Error'));

    fetch(`${API}/bot-status`)
      .then(res => res.json())
      .then(data => setBotRunning(data.running));

    fetch(`${API}/last-action`)
      .then(res => res.json())
      .then(data =>
        setLastAction(`${data.message} at ${new Date(data.timestamp).toLocaleTimeString()}`)
      );

    fetch(`${API}/log`)
      .then(res => res.json())
      .then(data =>
        setTradeLog(
          data.map((entry: any) => `${entry.message} @ ${new Date(entry.timestamp).toLocaleTimeString()}`)
        )
      );
  }, []);

  const startBot = async () => {
    const res = await fetch(`${API}/start-bot`, { method: 'POST' });
    const data = await res.json();
    alert(data.message);
  };

  const emergencyWithdraw = async () => {
    const res = await fetch(`${API}/emergency-withdraw`, { method: 'POST' });
    const data = await res.json();
    alert(data.message);
  };

  const deposit = async () => {
    const res = await fetch(`${API}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: depositAmount }),
    });
    const data = await res.json();
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
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📈 GMX Trading Bot Dashboard</h1>

      <p><strong>Balance:</strong> {balance} ETH</p>
      <p><strong>Bot Status:</strong> {botRunning ? '✅ Running' : '⛔️ Stopped'}</p>
      <p><strong>Last Action:</strong> {lastAction}</p>

      <h2>📋 Trade Log</h2>
      {tradeLog.length === 0 ? (
        <p>No recent trades</p>
      ) : (
        <ul>
          {tradeLog.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      )}

      <hr />

      <h3>🟢 Controls</h3>
      <button onClick={startBot} style={{ marginRight: '1rem' }}>
        {botRunning ? '🔴 Restart Bot' : '🟢 Start Bot'}
      </button>
      <button onClick={emergencyWithdraw}>🚨 Emergency Withdraw</button>

      <hr />

      <h3>💰 Deposit ETH</h3>
      <input
        type="text"
        placeholder="Amount in ETH"
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
      />
      <button onClick={deposit} style={{ marginLeft: '1rem' }}>Deposit</button>

      <hr />

      <h3>⚙️ Update Trade Settings</h3>
      <input
        type="text"
        placeholder="Trade Amount (ETH)"
        value={settingsTradeAmount}
        onChange={(e) => setSettingsTradeAmount(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Leverage"
        value={leverage}
        onChange={(e) => setLeverage(e.target.value)}
        style={{ marginTop: '0.5rem' }}
      />
      <br />
      <button onClick={updateSettings} style={{ marginTop: '0.5rem' }}>
        Update Settings
      </button>

      <hr />
      <p style={{ fontStyle: 'italic', color: 'gray' }}>
        Manual trading has been disabled. All trades are managed by the backend bot logic.
      </p>
    </div>
  );
};

export default App;
