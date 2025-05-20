// routes/trade.js
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const {
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  PROVIDER_URL
} = process.env;

// Smart contract ABI with only what’s needed
const ABI = [
  "function executeTrade(bool isLong, uint256 acceptablePrice) external payable"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// ✅ POST /trade
router.post('/', async (req, res) => {
  const { isLong, acceptablePrice, amount } = req.body;

  // Validate input
  if (typeof isLong !== 'boolean' || isNaN(acceptablePrice) || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input. Expected: isLong (boolean), acceptablePrice (number), amount (number)'
    });
  }

  try {
    const tx = await contract.executeTrade(isLong, acceptablePrice, {
      value: ethers.parseEther(amount.toString())
    });
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: 'Trade executed successfully',
      txHash: tx.hash
    });
  } catch (err) {
    console.error('❌ Trade execution failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: err.message
    });
  }
});

export default router;
