// routes/trade.js
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { PRIVATE_KEY, CONTRACT_ADDRESS, PROVIDER_URL } = process.env;

const ABI = [
  "function executeTrade(bool isLong, uint256 acceptablePrice) external payable"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

router.post('/', async (req, res) => {
  const { isLong, acceptablePrice, amount } = req.body;

  try {
    const tx = await contract.executeTrade(isLong, acceptablePrice, {
      value: ethers.parseEther(amount.toString()),
    });
    await tx.wait();
    res.json({ success: true, message: 'Trade executed', txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
