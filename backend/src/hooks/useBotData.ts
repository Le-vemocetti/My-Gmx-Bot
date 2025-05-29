import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useBotData() {
  const [status, setStatus] = useState<any>(null);
  const [trade, setTrade] = useState<any>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<any>(null);
  const [log, setLog] = useState<any[]>([]);
  const [balance, setBalance] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [
        statusData,
        tradeData,
        priceData,
        actionData,
        logData,
        balanceData,
      ] = await Promise.all([
        api.getBotStatus(),
        api.getCurrentTrade(),
        api.getCurrentPrice(),
        api.getLastAction(),
        api.getTradeLog(),
        api.getBalance(),
      ]);
      setStatus(statusData);
      setTrade(tradeData);
      setPrice(priceData.price);
      setLastAction(actionData);
      setLog(logData);
      setBalance(balanceData.balance);
    } catch (err) {
      console.error('Failed to fetch bot data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return { status, trade, price, lastAction, log, balance, loading, refresh };
}
