// src/services/botWorker.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import axios from 'axios';
import { SMA, StochasticRSI } from 'technicalindicators';
import BotABI from '../abi/BotABI.json' assert { type: 'json' };
import { executeTrade as contractExecuteTrade } from '../controllers/execute-trade.js';

const BOT_MODE = process.env.BOT_MODE || 'simulation'; // 'live' or 'simulation'

const { ARBITRUM_RPC, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
if (!ARBITRUM_RPC || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('❌ Missing environment variables in .env');
}

export const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
export const botContract = new ethers.Contract(CONTRACT_ADDRESS, BotABI, wallet);

export const getWalletBalance = async (): Promise<ethers.BigNumber> => {
  return await provider.getBalance(wallet.address);
};

// ─── State ────────────────────────────────────────────────
let monitorInterval: NodeJS.Timeout | null = null;
let currentPosition: 'long' | 'short' | null = null;
let entryPrice: number | null = null;
let lastPrice: number | null = null;
let capital = 1000; // USD base for calculations
const priceHistory: number[] = [];

const SMA_PERIOD = 14;
const STOCH_PERIOD = 14;
const RSI_PERIOD = 14;
const K_PERIOD = 3;
const D_PERIOD = 3;

// ─── Trade Log ─────────────────────────────────────────────
interface TradeEntry {
  direction: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  timestamp: string;
}
export let tradeHistory: TradeEntry[] = [];

export const getCurrentTrade = () => {
  if (!currentPosition || tradeHistory.length === 0) return { active: false };
  const lastTrade = tradeHistory[0];
  return {
    active: true,
    direction: lastTrade.direction,
    entryPrice: lastTrade.entryPrice,
    pnl: lastTrade.pnl ?? null,
    timestamp: lastTrade.timestamp
  };
};

export const getBotStatus = () => ({
  running: monitorInterval !== null,
  hasOpenTrade: currentPosition !== null
});

// ─── Price Fetcher ────────────────────────────────────────
const fetchPrice = async (): Promise<number> => {
  const { data } = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
  return parseFloat(data.price);
};

// ─── Fibonacci Calculator ─────────────────────────────────
const calculateFibonacciLevels = (values: number[]) => {
  const high = Math.max(...values);
  const low = Math.min(...values);
  const diff = high - low;
  return {
    level23: high - diff * 0.236,
    level38: high - diff * 0.382,
    level50: high - diff * 0.5,
    level61: high - diff * 0.618
  };
};

// ─── Trade Executor ───────────────────────────────────────
const executeTrade = async (direction: 'Buy' | 'Sell', price: number) => {
  currentPosition = direction === 'Buy' ? 'long' : 'short';
  entryPrice = price;

  tradeHistory.unshift({
    direction,
    entryPrice: price,
    timestamp: new Date().toISOString()
  });

  const isLong = direction === 'Buy';
  const ethAmount = ethers.parseEther("0.01"); // 0.01 ETH
  const acceptablePrice = price;

  if (BOT_MODE === 'live') {
    try {
      await contractExecuteTrade({
        isLong,
        acceptablePrice,
        ethValue: ethAmount,
      });
      console.log(`🚀 Live trade executed: ${isLong ? 'BUY' : 'SELL'} at $${acceptablePrice}`);
    } catch (err) {
      console.error('❌ Failed to execute live trade:', err);
    }
  } else {
    console.log(`🧪 Simulated ${direction} trade at $${price}`);
    // You could also call a `runSimulationTrade(...)` here
  }

  console.log(`📈 Executed ${direction} at $${price}`);
};


// ─── Exit Condition Checker ───────────────────────────────
const checkExitCondition = async (price: number) => {
  if (!entryPrice || !currentPosition) return;

  const entry = entryPrice;
  const change = ((price - entry) / entry) * 100 * (currentPosition === 'long' ? 1 : -1);

  if (change <= -1) {
    console.log(`🛑 Stop loss hit: ${change.toFixed(2)}%`);
    await closeTrade(price);
    return;
  }

  const sma = SMA.calculate({ period: SMA_PERIOD, values: priceHistory });
  const stochRsi = StochasticRSI.calculate({
    values: priceHistory,
    rsiPeriod: RSI_PERIOD,
    stochasticPeriod: STOCH_PERIOD,
    kPeriod: K_PERIOD,
    dPeriod: D_PERIOD
  });
  const fib = calculateFibonacciLevels(priceHistory.slice(-SMA_PERIOD));
  const latestSMA = sma[sma.length - 1];
  const latestStoch = stochRsi[stochRsi.length - 1];
  if (!latestSMA || !latestStoch || !fib) return;

  const reversalSignal =
    currentPosition === 'long'
      ? (price < latestSMA ? 1 : 0) +
        (latestStoch.k > 80 ? 1 : 0) +
        (price < fib.level61 ? 1 : 0)
      : (price > latestSMA ? 1 : 0) +
        (latestStoch.k < 20 ? 1 : 0) +
        (price > fib.level38 ? 1 : 0);

  if (reversalSignal >= 2) {
    console.log('📉 Reversal condition met — taking profit');
    await closeTrade(price);
  }
};

// ─── Bot Start/Stop ───────────────────────────────────────
export const startBot = async () => {
  if (monitorInterval) return;

  console.log('🟢 Bot started');

  monitorInterval = setInterval(async () => {
    try {
      const price = await fetchPrice();
      lastPrice = price;
      priceHistory.push(price);
      if (priceHistory.length > 100) priceHistory.shift();
      if (priceHistory.length < SMA_PERIOD) return;

      const sma = SMA.calculate({ period: SMA_PERIOD, values: priceHistory });
      const stochRsi = StochasticRSI.calculate({
        values: priceHistory,
        rsiPeriod: RSI_PERIOD,
        stochasticPeriod: STOCH_PERIOD,
        kPeriod: K_PERIOD,
        dPeriod: D_PERIOD
      });
      const fib = calculateFibonacciLevels(priceHistory.slice(-SMA_PERIOD));
      const latestSMA = sma[sma.length - 1];
      const latestStoch = stochRsi[stochRsi.length - 1];
      if (!latestSMA || !latestStoch || !fib) return;

      const signals = {
        bullish:
          (price > latestSMA ? 1 : 0) +
          (latestStoch.k < 20 ? 1 : 0) +
          (price > fib.level38 ? 1 : 0),
        bearish:
          (price < latestSMA ? 1 : 0) +
          (latestStoch.k > 80 ? 1 : 0) +
          (price < fib.level61 ? 1 : 0)
      };

      if (signals.bullish >= 2 && currentPosition !== 'long') {
        console.log('🛒 Buy signal (2/3)');
        await executeTrade('Buy', price);
      }

      if (signals.bearish >= 2 && currentPosition !== 'short') {
        console.log('💰 Sell signal (2/3)');
        await executeTrade('Sell', price);
      }

      await checkExitCondition(price);
    } catch (err: any) {
      console.error('❌ Bot error:', err.message);
    }
  }, 10_000); // every 10 seconds
};

export const stopBot = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('🔴 Bot stopped');
  }
};

// ✅ Emergency Withdraw
export const emergencyWithdraw = async () => {
  try {
    const tx = await botContract.emergencyWithdraw({
      gasLimit: 3_000_000,
    });
    console.log('🚨 emergencyWithdraw() tx sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('✅ Emergency withdrawal successful');
    } else {
      console.error('❌ Transaction failed');
    }
  } catch (err: any) {
    console.error('❌ Emergency withdrawal error:', err.reason || err.message || err);
  }
};


// Optional: for price overlay on frontend
export const getLatestPriceCached = async (): Promise<number> => {
  if (lastPrice) return lastPrice;
  return await fetchPrice();
};

