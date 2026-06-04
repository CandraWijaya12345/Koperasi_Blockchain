const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
    const contractAddress = '0x3BE9a134d553De9841f9FB116FE6B290c78C95d6';
    const abi = ['function saldoIDR() view returns (address)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
        const tokenAddress = await contract.saldoIDR();
        console.log('IDR_TOKEN_ADDRESS:', tokenAddress);
    } catch (error) {
        console.error('Error fetching token address:', error.message);
    }
}

main();
