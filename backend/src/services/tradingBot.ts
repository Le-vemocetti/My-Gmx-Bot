import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import axios from "axios";
import fs from "fs";
import express from "express";
import { SMA, StochasticRSI } from "technicalindicators";

import BotABI from "../abi/BotABI.json";

const {
  WALLET_ADDRESS,
  PRIVATE_KEY,
  ARBITRUM_RPC,
  CONTRACT_ADDRESS,
} = process.env;

if (!WALLET_ADDRESS || !PRIVATE_KEY || !ARBITRUM_RPC || !CONTRACT_ADDRESS) {
  throw new Error("❌ Missing required environment variables.");
}

const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const botContract = new ethers.Contract(CONTRACT_ADDRESS, BotABI, wallet);

const INTERVAL_HOURS = 4;
const SMA_PERIOD = 21;
const LEVERAGE = 3;
const TRADE_LOG = "./trade_log.json";

interface Candle {
  time: number;
  close: number;
}

interface Trade {
  signal: "BUY" | "SELL";
  entryPrice: number;
  leverage: number;
  timestamp: number;
  status: "OPEN" | "CLOSED";
}

// ✅ Binance OHLC fetcher
async function fetchOHLC(): Promise<Candle[]> {
  const symbol = "ETHUSDT";
  const interval = "4h";
  const limit = 100;

  const res = await axios.get("https://api.binance.com/api/v3/klines", {
    params: { symbol, interval, limit },
  });

  return res.data.map((candle: any[]) => ({
    time: candle[0],
    close: parseFloat(candle[4]),
  }));
}

function calculateIndicators(candles: Candle[]) {
  const closes = candles.map(c => c.close);
  const sma = SMA.calculate({ period: SMA_PERIOD, values: closes });
  const srsi = StochasticRSI.calculate({
    values: closes,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });

  const recentCloses = closes.slice(-10);
  const high = Math.max(...recentCloses);
  const low = Math.min(...recentCloses);
  const diff = high - low;
  const fibLevels = {
    "0.236": high - 0.236 * diff,
    "0.382": high - 0.382 * diff,
    "0.5": high - 0.5 * diff,
    "0.618": high - 0.618 * diff,
    "0.786": high - 0.786 * diff,
  };

  return {
    currentPrice: closes[closes.length - 1],
    sma21: sma[sma.length - 1],
    srsiK: srsi[srsi.length - 1]?.k,
    srsiD: srsi[srsi.length - 1]?.d,
    fibLevels,
  };
}

function generateSignal({
  currentPrice,
  sma21,
  srsiK,
  fibLevels,
}: {
  currentPrice: number;
  sma21: number;
  srsiK?: number;
  fibLevels: Record<string, number>;
}): "BUY" | "SELL" | null {
  if (srsiK === undefined || sma21 === undefined) return null;
  if (srsiK < 20 && currentPrice > sma21 && currentPrice > fibLevels["0.5"]) return "BUY";
  if (srsiK > 80 && currentPrice < sma21 && currentPrice < fibLevels["0.5"]) return "SELL";
  return null;
}

function loadTrade(): Trade | null {
  if (fs.existsSync(TRADE_LOG)) {
    return JSON.parse(fs.readFileSync(TRADE_LOG, "utf-8")) as Trade;
  }
  return null;
}

function saveTrade(trade: Trade) {
  fs.writeFileSync(TRADE_LOG, JSON.stringify(trade, null, 2));
}

function clearTrade() {
  if (fs.existsSync(TRADE_LOG)) fs.unlinkSync(TRADE_LOG);
}

async function executeTrade(signal: "BUY" | "SELL", entryPrice: number) {
  const amountETH = "0.01";
  const amountIn = ethers.parseUnits(amountETH, 18);

  try {
    const tx = await botContract.executeTrade(signal === "BUY", Math.floor(entryPrice));
    console.log(`✅ ${signal} trade executed. TX:`, tx.hash);
    await tx.wait();
    saveTrade({ signal, entryPrice, leverage: LEVERAGE, timestamp: Date.now(), status: "OPEN" });
  } catch (e: any) {
    console.error("❌ Trade execution failed:", e.message || e);
  }
}

async function manageRisk() {
  const trade = loadTrade();
  if (!trade || trade.status !== "OPEN") return;

  const prices = await fetchOHLC();
  const currentPrice = prices[prices.length - 1].close;
  const stopLossPrice = trade.entryPrice * 0.97;
  const takeProfitPrice = trade.entryPrice * 1.03;
  const reverseSignal = trade.signal === "BUY" ? "SELL" : "BUY";

  const currentSignal = generateSignal(calculateIndicators(prices));

  if (
    (trade.signal === "BUY" && (currentPrice <= stopLossPrice || currentPrice >= takeProfitPrice)) ||
    (trade.signal === "SELL" && (currentPrice >= stopLossPrice || currentPrice <= takeProfitPrice)) ||
    currentSignal === reverseSignal
  ) {
    try {
      const sizeDelta = trade.entryPrice * trade.leverage;
      const tx = await botContract.closeTrade(trade.signal === "BUY", Math.floor(sizeDelta));
      console.log("🔻 Position closed. TX:", tx.hash);
      await tx.wait();
      clearTrade();
    } catch (err: any) {
      console.error("❌ Closing trade failed:", err.message || err);
    }
  }
}

async function runBotCycle() {
  try {
    const candles = await fetchOHLC();
    const indicators = calculateIndicators(candles);
    const currentTrade = loadTrade();

    if (!currentTrade) {
      const signal = generateSignal(indicators);
      if (signal) {
        console.log("📈 Signal:", signal);
        await executeTrade(signal, indicators.currentPrice);
      } else {
        console.log("👀 No signal this cycle.");
      }
    } else {
      await manageRisk();
    }
  } catch (err) {
    console.error("⚠️ Bot Error:", err);
  }
}

export async function startTradingBot() {
  console.log("⏱️ Starting trading bot loop...");
  setInterval(async () => {
    console.log("⏱️ Running scheduled market evaluation...");
    await runBotCycle();
  }, 60 * 1000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.get("/", (_req, res) => {
    res.send("🟢 Trading bot is running...");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Bot server listening on http://localhost:${PORT}`);
  });

  startTradingBot();
}
