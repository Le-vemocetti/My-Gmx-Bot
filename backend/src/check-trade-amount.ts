import { ethers } from "ethers";
import abi from "./abi/botABI.json"; // Ensure this path and filename are correct

// Load environment variables from .env if needed
import * as dotenv from "dotenv";
dotenv.config();

// Use actual RPC URL from environment or fallback to a default (make sure fallback is a URL only)
const RPC_URL = process.env.ARBITRUM_RPC || "https://arb-mainnet.g.alchemy.com/v2/OCA4gYKdqLrYdBQQm5amY5gE7DAf5Sgw";
const CONTRACT_ADDRESS = "0x8cd1acb437a06fcc1d1dd17fb51f807a3907543d"; // Replace with your deployed contract address

async function checkTradeAmount() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    const amountWei = await contract.tradeAmountETH();
    const amountETH = ethers.formatEther(amountWei);
    console.log(`💰 tradeAmountETH: ${amountETH} ETH`);
  } catch (error: any) {
    console.error("❌ Error fetching tradeAmountETH:", error.message || error);
  }
}

checkTradeAmount();
