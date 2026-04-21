const { ethers } = require('ethers');
require('dotenv').config({ path: './server/.env' });

async function checkAdminBalance() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    
    try {
        const balance = await provider.getBalance(wallet.address);
        const contractAddr = process.env.CONTRACT_ADDRESS;
        const abi = ['function idrToken() view returns (address)'];
        const contract = new ethers.Contract(contractAddr, abi, provider);
        const tokenAddr = await contract.idrToken();

        console.log("Admin Wallet:", wallet.address);
        console.log("Balance:", ethers.formatEther(balance), "POL");
        console.log("IDR Token Address:", tokenAddr);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkAdminBalance();
