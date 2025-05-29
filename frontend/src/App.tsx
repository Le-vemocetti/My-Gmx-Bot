import { useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import * as botApi from "@/api/bot";

const BotDashboard = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [leverage, setLeverage] = useState<number>(1);
  const [balance, setBalance] = useState("Loading...");
  const [status, setStatus] = useState(false);
  const [lastAction, setLastAction] = useState("Loading...");
  const [tradeLog, setTradeLog] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState("Loading...");
  const [currentTrade, setCurrentTrade] = useState<{
    direction: string;
    size: number;
    price: number;
  } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bal, stat, last, log, price, trade] = await Promise.all([
          botApi.getBalance(),
          botApi.getStatus(),
          botApi.getLastAction(),
          botApi.getLog(),
          botApi.getCurrentPrice(),
          botApi.getCurrentTrade()
        ]);

        setBalance(bal.data.balance);
        setStatus(stat.data.running);
        setLastAction(`${last.data.message} at ${new Date(last.data.timestamp).toLocaleTimeString()}`);
        setTradeLog(
          log.data.map((entry: any) => `${entry.message} @ ${new Date(entry.timestamp).toLocaleTimeString()}`)
        );
        setCurrentPrice(price.data.price.toFixed(2));

        if (trade.data.direction) {
          setCurrentTrade({
            direction: trade.data.direction,
            size: trade.data.size,
            price: trade.data.price
          });
        } else {
          setCurrentTrade(null);
        }
      } catch (err) {
        console.error("❌ Failed to load bot data:", err);
      }
    };

    const checkWallet = async () => {
      const provider: any = await detectEthereumProvider();
      if (provider && window.ethereum?.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress);
      }
    };

    fetchAll();
    checkWallet();
  }, []);

  const connectWallet = async () => {
    try {
      const provider: any = await detectEthereumProvider();
      if (!provider) return alert("MetaMask not detected!");

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet.");
    }
  };

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

      {/* Market + Status */}
      <Card className="mb-6">
        <CardContent>
          <p className="mb-1"><strong>Current ETH Price:</strong> ${currentPrice}</p>
          <p className="mb-1"><strong>Balance:</strong> {balance} ETH</p>
          <p className="mb-1"><strong>Status:</strong> {status ? '✅ Running' : '⛔️ Stopped'}</p>
          <p className="mb-1"><strong>Last Action:</strong> {lastAction}</p>
          <p className="mb-1"><strong>Wallet:</strong> {walletAddress ?? "Not connected"}</p>
          <Button onClick={connectWallet} className="mt-2">
            {walletAddress ? "🔄 Reconnect Wallet" : "🔌 Connect Wallet"}
          </Button>
        </CardContent>
      </Card>

      {/* Current Trade */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="font-semibold mb-3 text-lg">📊 Current Trade</h2>
          {currentTrade ? (
            <div className="space-y-1 text-gray-700 dark:text-gray-300">
              <p><strong>Direction:</strong> {currentTrade.direction}</p>
              <p><strong>Size:</strong> {currentTrade.size} ETH</p>
              <p><strong>Entry Price:</strong> ${currentTrade.price}</p>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No active trade</p>
          )}
        </CardContent>
      </Card>

      {/* Trade Log */}
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

      {/* Controls */}
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
              onChange={(e) => setEthAmount(e.target.value)}
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
              onChange={(e) => setLeverage(parseInt(e.target.value))}
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

