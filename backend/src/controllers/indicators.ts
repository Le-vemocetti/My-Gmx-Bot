export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

export function calculateSRSI(prices: number[], period = 14): { buySignal: boolean; sellSignal: boolean; value: string } {
  if (prices.length < period + 1) return { buySignal: false, sellSignal: false, value: '0' };

  const recent = prices.slice(-period);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const last = prices[prices.length - 1];

  const range = max - min;
  const srsi = range === 0 ? 0 : ((last - min) / range) * 100;

  return {
    buySignal: srsi < 20,
    sellSignal: srsi > 80,
    value: srsi.toFixed(2),
  };
}

export function calculateFibLevels(prices: number[]): Record<string, number> {
  const recent = prices.slice(-50);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const diff = high - low;

  return {
    '0.236': high - diff * 0.236,
    '0.382': high - diff * 0.382,
    '0.618': high - diff * 0.618,
    high,
    low,
  };
}
