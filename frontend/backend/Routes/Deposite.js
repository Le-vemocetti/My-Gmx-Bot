import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Load from .env
const {
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  GMX_ROUTER,
  INDEX_TOKEN,
  PROVIDER_URL
} = process.env;

const ABI = [ // minimal ABI for deposit and trading
  "function depositETH() external payable",
  "function executeTrade(bool isLong, uint256 acceptablePrice) external payable",
  "function emergencyWithdraw(address to) external",
  "function setTradeSettings(uint256 _tradeAmountETH, uint256 _leverage) external"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// ✅ Deposit route (fund bot with ETH)
router.post('/', async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  try {
    const tx = await contract.depositETH({ value: ethers.parseEther(amount.toString()) });
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Contract call failed' });
  }
});

export default router;
