const { ethers } = require('ethers');

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const koperasiAddress = "0xD2530547B22dE9C45fE0AEcd0af421fBB29C6d6f";
    
    const abi = ["function idrToken() view returns (address)"];
    const contract = new ethers.Contract(koperasiAddress, abi, provider);
    
    try {
        const tokenAddress = await contract.idrToken();
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
