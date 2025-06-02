import express from 'express';
import { simulateTrade } from '../../controller/trade-controller.js';

const router = express.Router();

if (process.env.NODE_ENV !== 'production') {
  router.post('/simulate-trade', async (req, res) => {
    const { isLong, price } = req.body;
    if (typeof isLong !== 'boolean' || typeof price !== 'number') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
      await simulateTrade(isLong, price);
      res.json({ success: true });
    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ error: 'Simulation failed' });
    }
  });
}

export { router };
