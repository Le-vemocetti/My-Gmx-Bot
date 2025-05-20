  // addLiquidity.js
require('dotenv').config();
const { ethers } = require('ethers');

const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
const GLP_MANAGER = '0x489ee077994B6658eAfA855C308275EAd8097C4A';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const GLP_MANAGER_ABI = [
  'function addLiquidity(address token, uint256 amount, uint256 minUsdg, uint256 minGlp) external returns (uint256)',
];

const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function addLiquidity(amountUSDC) {
  const usdc = new ethers.Contract(USDC, ERC20_ABI, wallet);
  const glpManager = new ethers.Contract(GLP_MANAGER, GLP_MANAGER_ABI, wallet);

  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits(amountUSDC, decimals);

  const allowance = await usdc.allowance(wallet.address, GLP_MANAGER);
  if (allowance < amount) {
    const txApprove = await usdc.approve(GLP_MANAGER, amount);
    await txApprove.wait();
    console.log('✅ Approved USDC for GLP Manager');
  }

  const tx = await glpManager.addLiquidity(USDC, amount, 0, 0);
  await tx.wait();
  console.log(`✅ Added ${amountUSDC} USDC as liquidity to GMX (GLP)`);
}

module.exports = { addLiquidity };
