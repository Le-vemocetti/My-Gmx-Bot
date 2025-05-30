import { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const { PRIVATE_KEY, CONTRACT_ADDRESS, PROVIDER_URL } = process.env;

const ABI = [
  "function depositETH() external payable"
];

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS!, ABI, wallet);

// Minimum $10 in ETH
const MINIMUM_USD = 10;

export const handleDeposit = async (req: Request, res: Response) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount. Must be a number greater than 0.',
    });
  }

  try {
    const response = await axios.get(
      'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'
    );
    const ethPrice = parseFloat(response.data.price);

    const ethAmount = parseFloat(amount);
    const usdEquivalent = ethAmount * ethPrice;

    if (usdEquivalent < MINIMUM_USD) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is $${MINIMUM_USD} (currently ~${(MINIMUM_USD / ethPrice).toFixed(6)} ETH)`,
      });
    }

    const valueInEther = ethers.parseEther(amount.toString());

    const tx = await contract.depositETH({ value: valueInEther });
    await tx.wait();

    return res.status(200).json({
      success: true,
      message: 'Deposit successful',
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error('❌ Deposit failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Transaction failed',
      error: err.message || err.toString(),
    });
  }
};
