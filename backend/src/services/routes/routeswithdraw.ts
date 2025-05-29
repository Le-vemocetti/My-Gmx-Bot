// routes/withdraw.js
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const {
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  PROVIDER_URL,
  OWNER_ADDRESS // This should be your receiving wallet
} = process.env;

// ABI: only emergencyWithdraw
const ABI = ["function emergencyWithdraw(address to) external"];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// ✅ POST /withdraw
router.post('/', async (req, res) => {
  if (!OWNER_ADDRESS) {
    return res.status(400).json({
      success: false,
      message: 'OWNER_ADDRESS is missing from .env'
    });
  }

  try {
    const tx = await contract.emergencyWithdraw(OWNER_ADDRESS);
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: 'Emergency withdrawal successful',
      txHash: tx.hash
    });
  } catch (err) {
    console.error('❌ Withdrawal failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Withdrawal transaction failed',
      error: err.message
    });
  }
});

export default router;
