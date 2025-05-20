export function shouldCloseTrade(entryPrice: number, currentPrice: number, isLong: boolean, peakProfit: number): boolean {
  const priceChange = isLong
    ? (currentPrice - entryPrice) / entryPrice
    : (entryPrice - currentPrice) / entryPrice;

  const currentProfit = priceChange * 100; // in percentage
  const drawdown = peakProfit - currentProfit;

  return drawdown >= 3;
}
