import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import BotABI from '../abi/BotABI.json' assert { type: 'json' };
import axios from 'axios';
import { SMA, StochasticRSI } from 'technicalindicators';

dotenv.config();

// Load env variables
const { ARBITRUM_RPC, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
if (!ARBITRUM_RPC || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('❌ Missing environment variables in .env');
}

// Blockchain setup
export const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
export const botContract = new ethers.Contract(CONTRACT_ADDRESS, BotABI, wallet);

export const getWalletBalance = async (): Promise<ethers.BigNumber> => {
  return await wallet.getBalance();
};

// Bot state
let monitorInterval: NodeJS.Timeout | null = null;
let currentPosition: 'long' | 'short' | null = null;
let entryPrice: number | null = null;

// ▶️ Start monitoring
export const startBot = async () => {
  if (monitorInterval) return; // Already running

  console.log('🤖 Bot started. Monitoring every 30 seconds...');

  monitorInterval = setInterval(async () => {
    try {
      const candles = await fetch4HData();
      // Binance kline: [ openTime, open, high, low, close, volume, ... ]
      const closePrices: number[] = candles.map((c: any) => parseFloat(c[4]));

      if (closePrices.length < 21) {
        console.warn('⚠️ Not enough data to calculate indicators.');
        return;
      }

      const sma21 = SMA.calculate({ period: 21, values: closePrices });
      const srsi = StochasticRSI.calculate({
        values: closePrices,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      });

      const latestPrice = closePrices.at(-1);
      const smaNow = sma21.at(-1);
      const srsiNow = srsi.at(-1)?.k;

      if (latestPrice === undefined || smaNow === undefined || srsiNow === undefined) {
        console.warn('⚠️ Missing indicator values.');
        return;
      }

      console.log(`📈 Price: ${latestPrice}, SMA21: ${smaNow}, SRSI K: ${srsiNow}`);

      // 🔻 Check stop loss (3%)
      if (entryPrice !== null && currentPosition !== null) {
        const stopLossHit =
          (currentPosition === 'long' && latestPrice <= entryPrice * 0.97) ||
          (currentPosition === 'short' && latestPrice >= entryPrice * 1.03);

        if (stopLossHit) {
          console.log('⛔ Stop loss triggered — exiting position');
          await exitPosition();
          return;
        }
      }

      // 📈 Long entry signal
      if (latestPrice > smaNow && srsiNow < 20 && currentPosition !== 'long') {
        if (currentPosition === 'short') {
          console.log('🔁 Reversal detected — exiting short');
          await exitPosition();
        }

        console.log('✅ BUY Signal Detected');
        await executeTrade(true);
        currentPosition = 'long';
        entryPrice = latestPrice;
      }
      // 📉 Short entry signal
      else if (latestPrice < smaNow && srsiNow > 80 && currentPosition !== 'short') {
        if (currentPosition === 'long') {
          console.log('🔁 Reversal detected — exiting long');
          await exitPosition();
        }

        console.log('✅ SELL Signal Detected');
        await executeTrade(false);
        currentPosition = 'short';
        entryPrice = latestPrice;
      }
    } catch (err: any) {
      console.error('❌ Market monitor error:', err.message || err);
    }
  }, 30_000);
};

// 🛑 Manual stop
export const stopBot = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    currentPosition = null;
    entryPrice = null;
    console.log('🛑 Bot stopped by user');
  }
};

// 🚨 Emergency withdraw (also stops bot)
export const emergencyWithdraw = async (walletAddress: string) => {
  stopBot();
  try {
    const tx = await botContract.emergencyWithdraw(walletAddress);
    await tx.wait();
    console.log('🚨 Emergency withdrawal complete');
  } catch (err: any) {
    console.error('❌ Emergency withdraw failed:', err.message || err);
  }
};

// ❎ Exit current trade position
const exitPosition = async () => {
  try {
    const tx = await botContract.closePosition();
    await tx.wait();
    console.log('❎ Position closed');
    currentPosition = null;
    entryPrice = null;
  } catch (err: any) {
    console.error('❌ Failed to close position:', err.message || err);
  }
};

// 💥 Execute trade
const executeTrade = async (isLong: boolean) => {
  try {
    const tx = await botContract.executeTrade(isLong);
    await tx.wait();
    console.log(`💥 Trade executed (${isLong ? 'Long' : 'Short'})`);
  } catch (err: any) {
    console.error('❌ Trade execution failed:', err.message || err);
  }
};

// 🕒 Fetch 4H candle data (Binance)
const fetch4HData = async (): Promise<any[]> => {
  const symbol = 'ETHUSDT';
  const interval = '4h';
  const limit = 100;

  try {
    const res = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval, limit },
    });
    return res.data;
  } catch (err: any) {
    console.error('❌ Failed to fetch OHLC data:', err.message || err);
    return [];
  }
};
