import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import {
  getBalance,
  getStatus,
  getLastAction,
  getLog,
  startBot,
  emergencyWithdraw,
  deposit as depositAPI,
  updateSettings as updateSettingsAPI,
} from './api/bot';

const App: React.FC = () => {
  const [balance, setBalance] = useState<string>('Loading...');
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>('Loading...');
  const [tradeLog, setTradeLog] = useState<string[]>([]);

  const [depositAmount, setDepositAmount] = useState('');
  const [leverage, setLeverage] = useState('');
  const [settingsTradeAmount, setSettingsTradeAmount] = useState('');

  useEffect(() => {
    getBalance()
      .then(res => setBalance(res.data.balance))
      .catch(() => setBalance('Error'));

    getStatus().then(res => setBotRunning(res.data.running));

    getLastAction().then(res =>
      setLastAction(`${res.data.message} at ${new Date(res.data.timestamp).toLocaleTimeString()}`)
    );

    getLog().then(res =>
      setTradeLog(
        res.data.map((entry: any) => `${entry.message} @ ${new Date(entry.timestamp).toLocaleTimeString()}`)
      )
    );
  }, []);

  const handleStartBot = async () => {
    const res = await startBot();
    alert(res.data.message);
  };

  const handleEmergencyWithdraw = async () => {
    const res = await emergencyWithdraw();
    alert(res.data.message);
  };

  const handleDeposit = async () => {
    const res = await depositAPI(depositAmount);
    alert(res.data.message);
  };

  const handleUpdateSettings = async () => {
    const res = await updateSettingsAPI(
      parseFloat(settingsTradeAmount),
      parseFloat(leverage)
    );
    alert(res.data.message);
  };

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <CardContent>
        <h1 className="text-3xl font-bold mb-4">📈 GMX Trading Bot Dashboard (v2)</h1>

        <p><strong>Balance:</strong> {balance} ETH</p>
        <p><strong>Bot Status:</strong> {botRunning ? '✅ Running' : '⛔️ Stopped'}</p>
        <p><strong>Last Action:</strong> {lastAction}</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">📋 Trade Log</h2>
        {tradeLog.length === 0 ? (
          <p>No recent trades</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {tradeLog.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        )}

        <hr className="my-6" />

        <h3 className="text-lg font-semibold mb-2">🟢 Controls</h3>
        <div className="flex space-x-4 mb-6">
          <Button onClick={handleStartBot} variant="default">
            {botRunning ? '🔴 Restart Bot' : '🟢 Start Bot'}
          </Button>
          <Button onClick={handleEmergencyWithdraw} variant="destructive">
            🚨 Emergency Withdraw
          </Button>
        </div>

        <h3 className="text-lg font-semibold mb-2">💰 Deposit ETH</h3>
        <div className="flex items-center space-x-4 mb-6">
          <Input
            type="text"
            placeholder="Amount in ETH"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <Button onClick={handleDeposit}>Deposit</Button>
        </div>

        <h3 className="text-lg font-semibold mb-2">⚙️ Update Trade Settings</h3>
        <div className="space-y-3 mb-6">
          <Input
            type="text"
            placeholder="Trade Amount (ETH)"
            value={settingsTradeAmount}
            onChange={(e) => setSettingsTradeAmount(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Leverage"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
          />
          <Button onClick={handleUpdateSettings}>Update Settings</Button>
        </div>

        <hr className="my-6" />
        <p className="italic text-gray-500 dark:text-gray-400">
          Manual trading has been disabled. All trades are managed by the backend bot logic.
        </p>
      </CardContent>
    </Card>
  );
};

export default App;
