// src/services/gmxBotStrategy.ts
import axios from "axios";
import fs from "fs";
import { ethers } from "ethers";
import { SMA, StochasticRSI } from "technicalindicators";
import dotenv from "dotenv";

dotenv.config();

const walletAddress = process.env.WALLET_ADDRESS!;
const privateKey = process.env.PRIVATE_KEY!;
const rpcUrl = process.env.ARBITRUM_RPC!;
const contractAddress = process.env.BOT_CONTRACT!;
const contractABI = require("../abi/BotABI.json");

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const botContract = new ethers.Contract(contractAddress, contractABI, wallet);

const ETH_ID = "ethereum";
const INTERVAL_HOURS = 4;
const SMA_PERIOD = 21;
const LEVERAGE = 3;
const TRADE_LOG = "./trade_log.json";

interface Candle {
  time: number;
  close: number;
}

interface Indicators {
  currentPrice: number;
  sma21: number;
  srsiK?: number;
  srsiD?: number;
  fibLevels: Record<string, number>;
}

export async function fetchOHLC(tokenId: string): Promise<Candle[]> {
  const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
    params: { vs_currency: "usd", days: "5", interval: "hourly" },
  });
  return res.data.prices
    .map((x: number[]) => ({ time: x[0], close: x[1] }))
    .filter((_, i: number) => i % INTERVAL_HOURS === 0);
}

export function calculateIndicators(candles: Candle[]): Indicators {
  const closes = candles.map((c) => c.close);
  const sma = SMA.calculate({ period: SMA_PERIOD, values: closes });
  const srsi = StochasticRSI.calculate({
    values: closes,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });

  const high = Math.max(...closes.slice(-10));
  const low = Math.min(...closes.slice(-10));
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

export function generateSignal({ currentPrice, sma21, srsiK, fibLevels }: Indicators): "BUY" | "SELL" | null {
  if (!srsiK || !sma21) return null;
  if (srsiK < 20 && currentPrice > sma21 && currentPrice > fibLevels["0.5"]) return "BUY";
  if (srsiK > 80 && currentPrice < sma21 && currentPrice < fibLevels["0.5"]) return "SELL";
  return null;
}

interface TradeLog {
  signal: "BUY" | "SELL";
  entryPrice: number;
  leverage: number;
  timestamp: number;
  status: "OPEN";
}

function loadTrade(): TradeLog | null {
  if (fs.existsSync(TRADE_LOG)) {
    const data = fs.readFileSync(TRADE_LOG, "utf-8");
    return JSON.parse(data);
  }
  return null;
}

function saveTrade(trade: TradeLog): void {
  fs.writeFileSync(TRADE_LOG, JSON.stringify(trade, null, 2));
}

function clearTrade(): void {
  if (fs.existsSync(TRADE_LOG)) fs.unlinkSync(TRADE_LOG);
}

export async function executeTrade(signal: "BUY" | "SELL", entryPrice: number): Promise<void> {
  try {
    const tx = await botContract.executeTrade(signal === "BUY", Math.floor(entryPrice));
    console.log(`✅ ${signal} trade executed. TX:`, tx.hash);
    await tx.wait();

    saveTrade({
      signal,
      entryPrice,
      leverage: LEVERAGE,
      timestamp: Date.now(),
      status: "OPEN",
    });
  } catch (e: any) {
    console.error("❌ Trade execution failed:", e.message);
  }
}

export async function manageRisk(): Promise<void> {
  const trade = loadTrade();
  if (!trade || trade.status !== "OPEN") return;

  const prices = await fetchOHLC(ETH_ID);
  const currentPrice = prices[prices.length - 1].close;
  const stopLoss = trade.entryPrice * 0.97;
  const profitTarget = trade.entryPrice * 1.03;
  const reverseSignal = trade.signal === "BUY" ? "SELL" : "BUY";

  const newSignal = generateSignal(calculateIndicators(prices));

  if (
    (trade.signal === "BUY" && currentPrice <= stopLoss) ||
    (trade.signal === "SELL" && currentPrice >= profitTarget) ||
    newSignal === reverseSignal
  ) {
    try {
      const tx = await botContract.closeTrade(trade.signal === "BUY", trade.entryPrice * trade.leverage);
      console.log("🔻 Position closed: Risk/TP/Reverse met. TX:", tx.hash);
      await tx.wait();
      clearTrade();
    } catch (err: any) {
      console.error("❌ Closing trade failed:", err.message);
    }
  }
}
