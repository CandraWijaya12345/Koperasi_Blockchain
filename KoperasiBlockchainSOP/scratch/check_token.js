const { ethers } = require('ethers');
require('dotenv').config({ path: './server/.env' });

async function checkTokenAddress() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const contractAddr = process.env.CONTRACT_ADDRESS;
    const abi = ['function idrToken() view returns (address)'];
    const contract = new ethers.Contract(contractAddr, abi, provider);
    
    try {
        const tokenAddr = await contract.idrToken();
        console.log("CONTRACT_ADDRESS:", contractAddr);
        console.log("TOKEN_ADDRESS from Contract:", tokenAddr);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkTokenAddress();
