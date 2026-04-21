const { ethers } = require('ethers');
require('dotenv').config({ path: './server/.env' });

async function checkSettings() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const contractAddr = process.env.CONTRACT_ADDRESS;
    const abi = ['function settings() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, address)'];
    const contract = new ethers.Contract(contractAddr, abi, provider);
    
    try {
        const s = await contract.settings();
        console.log("Settings:");
        console.log(" - nominalSimpananPokok:", s[0].toString());
        console.log(" - nominalSimpananWajib:", s[1].toString());
        console.log(" - currentLiquidityPool:", s[14].toString());
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkSettings();
