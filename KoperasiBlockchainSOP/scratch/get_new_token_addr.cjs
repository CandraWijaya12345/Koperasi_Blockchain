const { ethers } = require('ethers');

async function main() {
    const RPC_URL = 'https://rpc-amoy.polygon.technology/';
    const KOPERASI_ADDRESS = '0x3BE9a134d553De9841f9FB116FE6B290c78C95d6';
    
    // Minimal ABI to get saldoIDR address
    const abi = ["function saldoIDR() view returns (address)"];
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(KOPERASI_ADDRESS, abi, provider);
    
    try {
        const tokenAddress = await contract.saldoIDR();
        console.log('KOPERASI_ADDRESS:', KOPERASI_ADDRESS);
        console.log('TOKEN_ADDRESS:', tokenAddress);
    } catch (error) {
        console.error('Error fetching token address:', error);
    }
}

main();
