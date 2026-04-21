const { ethers } = require('ethers');

async function main() {
    const RPC_URL = 'https://rpc-amoy.polygon.technology/';
    const KOPERASI_ADDRESS = '0xe90dD66F48dE541afc3a5B756d8058021F5Cf0ED';
    
    // Minimal ABI to get idrToken address
    const abi = ["function idrToken() view returns (address)"];
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(KOPERASI_ADDRESS, abi, provider);
    
    try {
        const tokenAddress = await contract.idrToken();
        console.log('KOPERASI_ADDRESS:', KOPERASI_ADDRESS);
        console.log('TOKEN_ADDRESS:', tokenAddress);
    } catch (error) {
        console.error('Error fetching token address:', error);
    }
}

main();
