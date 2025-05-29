// src/routes/botRoutes.ts

import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { handleDeposit } from '../controllers/botController';
import {
  startBot,
  stopBot,
  getBotStatus,
  getWalletBalance,
  getCurrentTrade,
  emergencyWithdraw,
  tradeHistory,
  getLatestPriceCached
} from '../botWorker.js'; // ✅ Now correct

dotenv.config();

const { WALLET_ADDRESS } = process.env;
if (!WALLET_ADDRESS) {
  throw new Error('❌ WALLET_ADDRESS is missing in .env');
}

const router = express.Router();

// ─── Runtime State ──────────────────────────────────────────────
let botRunning = false;
let botSettings: Record<string, any> = {};

interface LogEntry {
  message: string;
  timestamp: string;
}

let lastAction: LogEntry = {
  message: '🤖 Bot initialized',
  timestamp: new Date().toISOString(),
};

let tradeLog: LogEntry[] = [lastAction];

const updateLastAction = (message: string) => {
  const entry = { message, timestamp: new Date().toISOString() };
  lastAction = entry;
  tradeLog.unshift(entry);
  if (tradeLog.length > 50) tradeLog.pop();
};

// ▶️ Start Bot
router.post('/start-bot', async (_req: Request, res: Response) => {
  try {
    if (botRunning) {
      return res.status(400).json({ message: '❌ Bot already running' });
    }
    await startBot();
    botRunning = true;
    updateLastAction('✅ Bot started');
    res.json({ message: '✅ Bot activated' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: '❌ Failed to start bot', error: err.message });
  }
});

// 🛑 Stop Bot
router.post('/stop-bot', (_req: Request, res: Response) => {
  try {
    stopBot();
    botRunning = false;
    updateLastAction('🛑 Bot manually stopped');
    res.json({ message: '🛑 Bot stopped manually' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: '❌ Failed to stop bot', error: err.message });
  }
});

// 🚨 Emergency Withdraw
router.post('/emergency-withdraw', async (_req: Request, res: Response) => {
  try {
    if (!botRunning) {
      return res.status(400).json({ message: '❌ Bot not running' });
    }
    await emergencyWithdraw(WALLET_ADDRESS);
    botRunning = false;
    updateLastAction('🚨 Emergency withdrawal executed');
    res.json({ message: '🚨 Withdraw successful' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: '❌ Withdraw failed', error: err.message });
  }
});

// POST /api/bot/deposit
router.post('/deposit', handleDeposit);

// 💰 Wallet Balance
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await getWalletBalance();
    res.json({ balance: ethers.formatEther(balance) });
  } catch (err: any) {
    console.error('❌ Failed to fetch balance:', err.message);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// 🌐 Bot Status
router.get('/bot-status', (_req: Request, res: Response) => {
  const runtimeStatus = getBotStatus();
  res.json({
    running: botRunning,
    ...runtimeStatus,
  });
});

// 📌 Last Action
router.get('/last-action', (_req: Request, res: Response) => {
  res.json(lastAction);
});

// 📜 Trade Log
router.get('/log', (_req: Request, res: Response) => {
  res.json(tradeLog);
});

// ⚙️ Bot Settings
router.post('/settings', (req: Request, res: Response) => {
  const settings = req.body;
  botSettings = settings;
  updateLastAction('📝 Bot settings updated');
  console.log('🔧 Updated settings:', settings);
  res.json({ message: '✅ Settings saved', settings });
});

router.get('/settings', (_req: Request, res: Response) => {
  res.json(botSettings);
});

// 🔍 Current Trade
router.get('/current-trade', (_req: Request, res: Response) => {
  try {
    const trade = getCurrentTrade();
    res.json(trade);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: '❌ Failed to get current trade', error: err.message });
  }
});

// 💹 Cached Latest Price
router.get('/current-price', async (_req: Request, res: Response) => {
  try {
    const price = await getLatestPriceCached();
    res.json({ price });
  } catch (err: any) {
    console.error('❌ Failed to fetch latest price:', err.message);
    res.status(500).json({ message: 'Failed to get price' });
  }
});

export default router;
