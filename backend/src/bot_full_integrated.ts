import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import axios from "axios";
import fs from "fs";
import { SMA, StochasticRSI } from "technicalindicators";

const walletAddress: string | undefined = process.env.WALLET_ADDRESS;
const privateKey: string | undefined = process.env.PRIVATE_KEY;
const rpcUrl: string | undefined = process.env.ARBITRUM_RPC;
const contractAddress: string | undefined = process.env.BOT_CONTRACT;
const contractABI = require("./abi/BotABI.json");

if (!privateKey || !rpcUrl || !contractAddress) {
  throw new Error("Missing required env variables");
}

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

interface FibLevels {
  [key: string]: number;
}

interface Indicators {
  currentPrice: number;
  sma21: number;
  srsiK?: number;
  srsiD?: number;
  fibLevels: FibLevels;
}

interface Trade {
  signal: "BUY" | "SELL";
  entryPrice: number;
  leverage: number;
  timestamp: number;
  status: "OPEN" | "CLOSED";
}

async function fetchOHLC(tokenId: string): Promise<Candle[]> {
  const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
    params: { vs_currency: "usd", days: "5", interval: "hourly" },
  });
  return res.data.prices
    .map((x: [number, number]) => ({ time: x[0], close: x[1] }))
    .filter((_: Candle, i: number) => i % INTERVAL_HOURS === 0);
}

function calculateIndicators(candles: Candle[]): Indicators {
  const closes = candles.map(c => c.close);
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
  const fibLevels: FibLevels = {
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

function generateSignal({ currentPrice, sma21, srsiK, fibLevels }: Indicators): "BUY" | "SELL" | null {
  if (srsiK === undefined || sma21 === undefined) return null;
  if (srsiK < 20 && currentPrice > sma21 && currentPrice > fibLevels["0.5"]) return "BUY";
  if (srsiK > 80 && currentPrice < sma21 && currentPrice < fibLevels["0.5"]) return "SELL";
  return null;
}

function loadTrade(): Trade | null {
  if (fs.existsSync(TRADE_LOG)) {
    const data = fs.readFileSync(TRADE_LOG, "utf-8");
    return JSON.parse(data);
  }
  return null;
}

function saveTrade(trade: Trade): void {
  fs.writeFileSync(TRADE_LOG, JSON.stringify(trade, null, 2));
}

function clearTrade(): void {
  if (fs.existsSync(TRADE_LOG)) fs.unlinkSync(TRADE_LOG);
}

async function executeTrade(signal: "BUY" | "SELL", entryPrice: number): Promise<void> {
  const amountETH = "0.01"; // or fetch from config
  const amountIn = ethers.parseUnits(amountETH, 18);
  const leverage = LEVERAGE;

  try {
    // Assuming executeTrade accepts boolean (true=BUY, false=SELL) and an integer price
    const tx = await botContract.executeTrade(signal === "BUY", Math.floor(entryPrice));
    console.log(`✅ ${signal} trade executed. TX:`, tx.hash);
    await tx.wait();
    saveTrade({
      signal,
      entryPrice,
      leverage,
      timestamp: Date.now(),
      status: "OPEN",
    });
  } catch (e: any) {
    console.error("❌ Trade execution failed:", e.message || e);
  }
}

async function manageRisk(): Promise<void> {
  const trade = loadTrade();
  if (!trade || trade.status !== "OPEN") return;

  const prices = await fetchOHLC(ETH_ID);
  const currentPrice = prices[prices.length - 1].close;
  const stopLoss = trade.entryPrice * 0.97;
  const reverseSignal: "BUY" | "SELL" = trade.signal === "BUY" ? "SELL" : "BUY";

  if (
    (trade.signal === "BUY" && currentPrice <= stopLoss) ||
    (trade.signal === "SELL" && currentPrice >= trade.entryPrice * 1.03) ||
    generateSignal(calculateIndicators(prices)) === reverseSignal
  ) {
    try {
      const tx = await botContract.closeTrade(trade.signal === "BUY", trade.entryPrice * trade.leverage);
      console.log("🔻 Position closed: Risk/TP/Reverse met. TX:", tx.hash);
      await tx.wait();
      clearTrade();
    } catch (err: any) {
      console.error("❌ Closing trade failed:", err.message || err);
    }
  }
}

(async () => {
  console.log("🤖 Starting Trading Bot...");

  try {
    const candles = await fetchOHLC(ETH_ID);
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
  } catch (err: any) {
    console.error("⚠️ Bot Error:", err.message || err);
  }
})();
