const { ethers } = require('ethers');

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const koperasiAddress = "0x3BE9a134d553De9841f9FB116FE6B290c78C95d6";
    
    const abi = ["function saldoIDR() view returns (address)"];
    const contract = new ethers.Contract(koperasiAddress, abi, provider);
    
    try {
        const tokenAddress = await contract.saldoIDR();
        const blockNumber = await provider.getBlockNumber();
        
        console.log("--- RESULTS ---");
        console.log(`KOPERASI_ADDRESS=${koperasiAddress}`);
        console.log(`TOKEN_ADDRESS=${tokenAddress}`);
        console.log(`DEPLOY_BLOCK=${blockNumber}`);
        console.log("---------------");
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
