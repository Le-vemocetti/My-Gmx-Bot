import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import abi from "../abi/BotABI.json" assert { type: "json" };

// Validate required environment variables
const { CONTRACT_ADDRESS, ARBITRUM_RPC, PRIVATE_KEY } = process.env;
if (!CONTRACT_ADDRESS || !ARBITRUM_RPC || !PRIVATE_KEY) {
  throw new Error("Missing required environment variables");
}

// Setup provider and signer
const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

// ✅ Main trade execution function
export async function executeTrade(
  isLong: boolean,
  acceptablePrice: string,
  ethValue: string
) {
  try {
    const tx = await contract.executeTrade(isLong, ethers.parseUnits(acceptablePrice, 30), {
      value: ethers.parseEther(ethValue),
      gasLimit: 3_000_000,
    });

    console.log("🟢 executeTrade() tx sent:", tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log("✅ Trade executed!");
    } else {
      console.error("❌ Transaction failed at contract level (status 0)");
    }
  } catch (err: any) {
    console.error("❌ Trade execution failed:", err.reason || err.message || err);
  }
}

// ✅ Run only if this file is executed directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const isLong = true;
  const acceptablePrice = "3100"; // price with 30 decimals
  const ethValue = "0.01";        // ETH value

  executeTrade(isLong, acceptablePrice, ethValue);
}
