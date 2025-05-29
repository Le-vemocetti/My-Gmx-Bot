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

const ABI = [
  "function depositETH() external payable"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

router.post('/', async (req, res) => {
  const { amount } = req.body;

  // Validate amount: must be string or number, > 0 and numeric
  if (
    amount === undefined ||
    amount === null ||
    isNaN(amount) || 
    Number(amount) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount. Must be a number greater than 0.'
    });
  }

  try {
    // Convert amount to string in case it's number
    const valueInEther = ethers.parseEther(amount.toString());

    const tx = await contract.depositETH({ value: valueInEther });
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: 'Deposit successful',
      txHash: tx.hash
    });
  } catch (err) {
    console.error('❌ Deposit failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: err.message || err.toString()
    });
  }
});

export default router;
