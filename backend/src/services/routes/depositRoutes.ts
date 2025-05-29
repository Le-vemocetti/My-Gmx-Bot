// src/services/routes/depositRoutes.ts
import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const { PRIVATE_KEY, CONTRACT_ADDRESS, PROVIDER_URL } = process.env;

const ABI = [
  "function depositETH() external payable"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY as string, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS as string, ABI, wallet);

router.post('/deposit', async (req, res) => {
  const { amount } = req.body;

  // ✅ Basic validation
  if (!amount || isNaN(amount) || Number(amount) < 0.004) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount. Must be at least $10 equivalent in ETH (i.e. ~0.004 ETH).'
    });
  }

  try {
    const valueInEther = ethers.parseEther(amount.toString());

    const tx = await contract.depositETH({ value: valueInEther });
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: 'Deposit successful',
      txHash: tx.hash
    });
  } catch (err: any) {
    console.error('❌ Deposit failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: err.message || err.toString()
    });
  }
});

export default router;
