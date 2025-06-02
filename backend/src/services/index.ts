// src/services/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import botRoutes from './routes/botRoutes.js';
import { startTradingBot } from './tradingBot.js'; // 👈 Bot service
import depositRoutes from './routes/depositRoutes.js';
import { router as simulationRoutes } from './routes/simulationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🧪 Only mount simulation routes in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/simulate', simulationRoutes);
}

// API Routes
app.use('/api/bot', botRoutes);
app.use('/api', depositRoutes); // So full route becomes /api/bot/deposit

// Optional: fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;

// Root route
app.get('/', (_req, res) => {
  res.send('🤖 GMX Bot Backend is Running');
});

// Start server and trading bot
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  startTradingBot(); // 👈 Start trading logic
});


