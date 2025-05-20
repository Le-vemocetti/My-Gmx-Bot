// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import botRoutes from './routes/botRoutes';
import { startTradingBot } from './services/tradingBot'; // 👈 Bot service

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/bot', botRoutes);

// Root route
app.get('/', (_req, res) => {
  res.send('🤖 GMX Bot Backend is Running');
});

// Start server and trading bot
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  startTradingBot(); // 👈 Start trading logic
});


