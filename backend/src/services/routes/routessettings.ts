// routes/settings.js
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ✅ Load environment variables
const {
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  PROVIDER_URL
} = process.env;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !PROVIDER_URL) {
  throw new Error('Missing required environment variables in .env');
}

// ✅ Minimal ABI for setting trading configuration
const ABI = [
  "function setTradeSettings(uint256 _tradeAmountETH, uint256 _leverage) external"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// ✅ Set trade settings
router.post('/', async (req, res) => {
  const { tradeAmountETH, leverage } = req.body;

  if (!tradeAmountETH || isNaN(tradeAmountETH) || !leverage || isNaN(leverage)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trade amount or leverage'
    });
  }

  try {
    const tx = await contract.setTradeSettings(
      ethers.parseEther(tradeAmountETH.toString()),
      parseInt(leverage)
    );
    await tx.wait();

    res.json({
      success: true,
      message: '✅ Trade settings updated successfully',
      txHash: tx.hash
    });
  } catch (err) {
    console.error('❌ Failed to update settings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
