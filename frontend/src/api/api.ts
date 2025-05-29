// src/lib/api.ts

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return res.json();
}

export const api = {
  getBotStatus: () => fetchJSON<{ running: boolean; inPosition: boolean; side: string | null; entryPrice: number | null; }>(`/bot-status`),
  getCurrentTrade: () => fetchJSON<{ side: string; entryPrice: number; size: number; timestamp: string }>(`/current-trade`),
  getCurrentPrice: () => fetchJSON<{ price: number }>(`/current-price`),
  getLastAction: () => fetchJSON<{ message: string; timestamp: string }>(`/last-action`),
  getTradeLog: () => fetchJSON<{ message: string; timestamp: string }[]>(`/log`),
  getBalance: () => fetchJSON<{ balance: string }>(`/balance`),
};
