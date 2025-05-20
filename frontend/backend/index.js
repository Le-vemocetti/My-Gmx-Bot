import express from 'express';
import dotenv from 'dotenv';
import tradeRouter from './routes/trade.js';
import withdrawRouter from './routes/withdraw.js';
import settingsRouter from './routes/settings.js';
import { botContract, walletAddress } from './botService.js'; // Updated path to botService

dotenv.config(); // Ensure the .env is loaded

const app = express();
app.use(express.json());

// Mount modular routers
app.use('/api/trade', tradeRouter);
app.use('/api/withdraw', withdrawRouter);
app.use('/api/settings', settingsRouter);

// ✅ Optional runtime state
let botRunning = false;

// ✅ Start the bot
app.post('/api/start-bot', async (req, res) => {
  try {
    const tx = await botContract.toggleBot();
    await tx.wait();
    botRunning = true;
    res.send({ message: "✅ Bot activated." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "❌ Failed to start bot.", error: err.message });
  }
});

// 🚨 Emergency Withdraw
app.post('/api/emergency-withdraw', async (req, res) => {
  try {
    const tx = await botContract.emergencyWithdraw(walletAddress);
    await tx.wait();
    botRunning = false;
    res.send({ message: "🚨 Emergency withdraw complete." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "❌ Emergency withdraw failed.", error: err.message });
  }
});

// 🧠 Bot Status
app.get('/api/bot-status', async (req, res) => {
  try {
    // Optional: use contract call to get real status instead
    const paused = await botContract.paused(); // if supported by your contract
    res.json({ running: !paused });
  } catch (err) {
    res.status(500).send({ message: 'Failed to get bot status', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
