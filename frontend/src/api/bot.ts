import axios from "axios";

const isDev = import.meta.env.DEV;

// Local dev will call localhost, production will use VITE_BACKEND_URL
const API = isDev
  ? "http://localhost:5000/api/bot"
  : `${import.meta.env.VITE_BACKEND_URL}/api/bot`;

export const getBalance = () => axios.get(`${API}/balance`);
export const getStatus = () => axios.get(`${API}/bot-status`);
export const getLastAction = () => axios.get(`${API}/last-action`);
export const getLog = () => axios.get(`${API}/log`);

export const startBot = () => axios.post(`${API}/start-bot`);
export const emergencyWithdraw = () => axios.post(`${API}/emergency-withdraw`);
export const deposit = (amount: string) =>
  axios.post(`${API}/deposit`, { amount });
export const updateSettings = (tradeAmountETH: number, leverage: number) =>
  axios.post(`${API}/settings`, { tradeAmountETH, leverage });

// ✅ New endpoints for trade status and price
export const getCurrentPrice = () => axios.get(`${API}/current-price`);
export const getCurrentTrade = () => axios.get(`${API}/current-trade`);
