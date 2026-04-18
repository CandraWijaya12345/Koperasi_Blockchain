const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Loading ABI...");
        // Path relative to server/verify_balance.js -> ../src/abi/idrtokenbaru.json
        const abiPath = path.join(__dirname, '../src/abi/idrtokenbaru.json');
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

        console.log("Connecting to RPC...");
        const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');

        const tokenAddress = "0x64Ac500ace0F003789Ff5906dDD8e7cd7BF7Bf7e";
        const koperasiAddress = "0x6e501AB6144961623b213E4b012B128504A8Db15";

        console.log(`Checking Balance of ${koperasiAddress} in Token ${tokenAddress}...`);
        const token = new ethers.Contract(tokenAddress, abi, provider);

        const bal = await token.balanceOf(koperasiAddress);
        console.log("---------------------------------------------------");
        console.log("FINAL BALANCE:", bal.toString());
        console.log("---------------------------------------------------");
    } catch (e) {
        console.error("ERROR:", e);
    }
}

main();
