import cron from 'node-cron';
import { evaluateAndTrade } from './controller/trade-controller';

// Schedule to run every 4 hours at minute 0 (e.g., 12:00 AM, 4:00 AM, 8:00 AM, etc.)
cron.schedule('0 */4 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running trade evaluation...`);
  try {
    await evaluateAndTrade();
  } catch (error) {
    console.error('Error during scheduled trade evaluation:', error);
  }
});

console.log('⏰ Scheduler started: trading evaluation runs every 4 hours.');
