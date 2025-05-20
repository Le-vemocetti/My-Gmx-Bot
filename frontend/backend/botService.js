// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' }); // Use absolute relative path if outside root
// dotenv.config(); // Optional fallback, can be left if unsure

// Import dependencies
import { ethers } from 'ethers';
import botAbi from './BotABI.json' assert { type: 'json' };

// Debug logs to confirm .env values
console.log("🧪 BOT_CONTRACT:", process.env.BOT_CONTRACT);
console.log("🧪 WALLET_ADDRESS:", process.env.WALLET_ADDRESS);
console.log("🧪 ARBITRUM_RPC:", process.env.ARBITRUM_RPC);
console.log("🧪 PRIVATE_KEY:", process.env.PRIVATE_KEY ? 'Loaded ✅' : 'Missing ❌');

// 🚨 Fail-safe: ensure all env variables are present
const requiredVars = ['BOT_CONTRACT', 'PRIVATE_KEY', 'ARBITRUM_RPC', 'WALLET_ADDRESS'];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`❌ Missing required environment variable: ${varName}`);
  }
}

// Ethers setup
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 🧠 Smart contract instance
export const botContract = new ethers.Contract(
  process.env.BOT_CONTRACT,
  botAbi,
  wallet
);

// Export wallet address
export const walletAddress = process.env.WALLET_ADDRESS;
