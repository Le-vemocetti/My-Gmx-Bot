// routes/withdraw.js
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { PRIVATE_KEY, CONTRACT_ADDRESS, PROVIDER_URL, OWNER_ADDRESS } = process.env;

const ABI = ["function emergencyWithdraw(address to) external"];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

router.post('/', async (req, res) => {
  try {
    const tx = await contract.emergencyWithdraw(OWNER_ADDRESS);
    await tx.wait();
    res.json({ success: true, message: 'Emergency withdrawal complete', txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
