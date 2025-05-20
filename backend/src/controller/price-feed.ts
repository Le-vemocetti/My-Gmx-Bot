import axios from 'axios';

export async function getRecentPrices(symbol = 'ETHUSDT', interval = '4h', limit = 100): Promise<number[]> {
  const url = 'https://api.binance.com/api/v3/klines';
  const params = { symbol, interval, limit };

  try {
    const response = await axios.get(url, { params });
    const prices = response.data.map((candle: any) => parseFloat(candle[4])); // Close prices
    return prices;
  } catch (error) {
    console.error('Error fetching price data:', error);
    return [];
  }
}
