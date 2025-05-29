// routes/botRoutes.js
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
require('dotenv').config();

const contractABI = require('../abi/BotABI.json');

const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const botContract = new ethers.Contract(process.env.BOT_CONTRACT, contractABI, wallet);
const walletAddress = process.env.WALLET_ADDRESS;

// 🧠 Track bot state (in-memory)
let botRunning = false;

// ✅ START the bot
router.post('/start-bot', async (req, res) => {
  try {
    const tx = await botContract.toggleBot();
    await tx.wait();
    botRunning = true;
    res.send({ message: '✅ Bot activated.' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: '❌ Failed to start bot.', error: err.message });
  }
});

// 🚨 EMERGENCY Withdraw
router.post('/emergency-withdraw', async (req, res) => {
  try {
    const tx = await botContract.emergencyWithdraw(walletAddress);
    await tx.wait();
    botRunning = false;
    res.send({ message: '🚨 Emergency withdraw complete.' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: '❌ Emergency withdraw failed.', error: err.message });
  }
});

// 🌐 Bot Status Check
router.get('/bot-status', (req, res) => {
  res.send({ running: botRunning });
});

module.exports = router;
