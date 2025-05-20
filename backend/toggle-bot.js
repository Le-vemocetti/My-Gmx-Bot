require("dotenv").config();
const { ethers } = require("ethers");
const abi = require('../.abi/botABI.json'); // Adjust if your ABI path is different

const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.BOT_CONTRACT, abi, wallet);

async function toggleBot() {
  try {
    const tx = await contract.toggleBot();
    console.log("🟢 toggleBot() transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Bot toggled successfully!");
  } catch (err) {
    console.error("❌ toggleBot failed:", err.message);
  }
}

toggleBot();
