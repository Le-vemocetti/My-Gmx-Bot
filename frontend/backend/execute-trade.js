require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("./abi/BotABI.json");

// === Setup ===
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.BOT_CONTRACT, abi, wallet);

// === Parameters ===
const isLong = true; // or false for short
const acceptablePrice = ethers.parseUnits("3100", 30); // Replace with realistic price value

async function executeTrade() {
  try {
    const tx = await contract.executeTrade(isLong, acceptablePrice, {
      value: ethers.parseEther("0.01"), // Match tradeAmountETH set in your contract
      gasLimit: 3000000,
    });

    console.log("🟢 executeTrade() tx sent:", tx.hash);
    await tx.wait();
    console.log("✅ Trade executed!");
  } catch (err) {
    console.error("❌ Trade execution failed:", err.message);
  }
}

executeTrade();
