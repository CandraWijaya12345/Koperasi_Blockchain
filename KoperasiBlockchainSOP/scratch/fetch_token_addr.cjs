const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
    const contractAddress = '0x6c24c9717B35CCB489C9bFa5E13e564f0735Fe1a';
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
