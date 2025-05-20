import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  botContract,
  wallet,
  startBot,
  stopBot,
  emergencyWithdraw,
  getWalletBalance
} from '../botWorker';

dotenv.config();

const { WALLET_ADDRESS } = process.env;
if (!WALLET_ADDRESS) {
  throw new Error('❌ WALLET_ADDRESS is missing in .env');
}

const router = express.Router();

// Runtime state
let botRunning = false;

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

// 💰 Get Wallet Balance
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balanceBigInt = await wallet.provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balanceBigInt);
    res.json({ balance: balanceInEth });
  } catch (err: any) {
    console.error('❌ Failed to fetch balance:', err);
    res.status(500).json({ message: '❌ Failed to fetch balance', error: err.message });
  }
});

// 🌐 Bot Status
router.get('/bot-status', (_req: Request, res: Response) => {
  res.json({ running: botRunning });
});

// 📌 Last Action
router.get('/last-action', (_req: Request, res: Response) => {
  res.json(lastAction);
});

// 📜 Trade Log
router.get('/log', (_req: Request, res: Response) => {
  res.json(tradeLog);
});

export default router;
