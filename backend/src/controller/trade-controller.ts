import { executeTrade } from './execute-trade.js';
import { calculateSMA, calculateSRSI, calculateFibLevels } from './indicators.js';
import { getRecentPrices } from './price-feed.js';
import { shouldCloseTrade } from './risk-manager.js';

let peakProfit = 0;
let entryPrice = 0;
let positionOpen = false;
let isLongPosition = true;

export async function simulateTrade(isLong, price) {
  console.log(`⚙️ Simulating ${isLong ? 'LONG' : 'SHORT'} trade at $${price}`);

  await executeTrade(isLong, price.toString(), '0.01');

  positionOpen = true;
  isLongPosition = isLong;
  entryPrice = parseFloat(price);
  peakProfit = 0;
}
 
export async function evaluateAndTrade() {
  const prices = await getRecentPrices();
  if (prices.length === 0) return;

  const sma21 = calculateSMA(prices, 21);
  const srsi = calculateSRSI(prices);
  const fib = calculateFibLevels(prices);
  const lastPrice = prices[prices.length - 1];

  console.log(`SMA(21): ${sma21.toFixed(2)}, SRSI: ${srsi.value}, Last Price: ${lastPrice}`);

  if (!positionOpen) {
    if (srsi.buySignal && lastPrice > sma21 && lastPrice > fib['0.618']) {
      console.log('📈 Buy conditions met');
      await executeTrade(true, lastPrice.toString(), '0.01');
      positionOpen = true;
      isLongPosition = true;
      entryPrice = lastPrice;
      peakProfit = 0;
    } else if (srsi.sellSignal && lastPrice < sma21 && lastPrice < fib['0.618']) {
      console.log('📉 Sell conditions met');
      await executeTrade(false, lastPrice.toString(), '0.01');
      positionOpen = true;
      isLongPosition = false;
      entryPrice = lastPrice;
      peakProfit = 0;
    } else {
      console.log('⏳ No trade conditions met');
    }
  } else {
    const priceChange = isLongPosition
      ? (lastPrice - entryPrice) / entryPrice
      : (entryPrice - lastPrice) / entryPrice;

    const currentProfit = priceChange * 100; // in percentage
    if (currentProfit > peakProfit) peakProfit = currentProfit;

    if (shouldCloseTrade(entryPrice, lastPrice, isLongPosition, peakProfit)) {
      console.log('🛑 Closing trade due to risk management');
      // Implement trade closing logic here
      positionOpen = false;
    } else {
      console.log(`📊 Current Profit: ${currentProfit.toFixed(2)}%, Peak Profit: ${peakProfit.toFixed(2)}%`);
    }
  }
}

// Schedule this function to run every 4 hours or as needed
evaluateAndTrade();
