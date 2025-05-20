const { ethers } = require("ethers");
const abi = require("./abi/botABI.json"); // Make sure this path is correct

// Replace with your actual values
const RPC_URL = process.env.ARBITRUM_RPC || "https://arb-sepolia.g.alchemy.com/v2/OCA4gYKdqLrYdBQQm5amY5gE7DAf5Sgw";
const CONTRACT_ADDRESS = "0x53f61b79ce648F70Ad0D64148e1b8b3D45F66970"; // Replace with your deployed contract address

async function checkTradeAmount() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    try {
        const amountWei = await contract.tradeAmountETH();
        const amountETH = ethers.formatEther(amountWei);
        console.log(`💰 tradeAmountETH: ${amountETH} ETH`);
    } catch (error) {
        console.error("❌ Error fetching tradeAmountETH:", error.message || error);
    }
}

checkTradeAmount();
