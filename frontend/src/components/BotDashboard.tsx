import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import * as botApi from "@/api/bot";

const BotDashboard = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [leverage, setLeverage] = useState<number>(1);
  const [balance, setBalance] = useState<string>("Loading...");
  const [status, setStatus] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>("Loading...");
  const [tradeLog, setTradeLog] = useState<string[]>([]);

  useEffect(() => {
    botApi.getBalance().then(res => setBalance(res.data.balance));
    botApi.getStatus().then(res => setStatus(res.data.running));
    botApi.getLastAction().then(res => {
      const { message, timestamp } = res.data;
      setLastAction(`${message} at ${new Date(timestamp).toLocaleTimeString()}`);
    });
    botApi.getLog().then(res => {
      const logs = res.data.map((entry: any) => `${entry.message} @ ${new Date(entry.timestamp).toLocaleTimeString()}`);
      setTradeLog(logs);
    });
  }, []);

  const handleDeposit = async () => {
    if (!ethAmount || Number(ethAmount) <= 0) {
      alert("Please enter a valid ETH amount to deposit.");
      return;
    }
    const res = await botApi.deposit(ethAmount);
    alert(res.data.message);
  };

  const handleStartBot = async () => {
    const res = await botApi.startBot();
    alert(res.data.message);
  };

  const handleUpdateSettings = async () => {
    if (!ethAmount || Number(ethAmount) <= 0 || leverage <= 0) {
      alert("Please enter valid trade amount and leverage.");
      return;
    }
    const res = await botApi.updateSettings(parseFloat(ethAmount), leverage);
    alert(res.data.message);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">📈 GMX Trading Bot Dashboard</h1>

      <Card className="mb-6">
        <CardContent>
          <p className="mb-1"><strong>Balance:</strong> {balance} ETH</p>
          <p className="mb-1"><strong>Status:</strong> {status ? '✅ Running' : '⛔️ Stopped'}</p>
          <p><strong>Last Action:</strong> {lastAction}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <h2 className="font-semibold mb-3 text-lg">📝 Trade Log</h2>
          {tradeLog.length ? (
            <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto text-sm text-gray-700 dark:text-gray-300">
              {tradeLog.map((log, idx) => <li key={idx}>{log}</li>)}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No trades yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <Button onClick={handleStartBot} className="w-full">
            {status ? '🔄 Restart Bot' : '🟢 Start Bot'}
          </Button>

          <div className="flex gap-3">
            <Input
              placeholder="ETH Amount"
              value={ethAmount}
              type="number"
              min="0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEthAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleDeposit}>💰 Deposit</Button>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Leverage"
              value={leverage}
              type="number"
              min="1"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeverage(parseInt(e.target.value))}
              className="flex-1"
            />
            <Button onClick={handleUpdateSettings}>⚙️ Update Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotDashboard;
