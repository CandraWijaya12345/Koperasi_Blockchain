const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Loading ABI...");
        // Path relative to server/verify_balance.js -> ../src/abi/idrABI.json
        const abiPath = path.join(__dirname, '../src/abi/idrABI.json');
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

        console.log("Connecting to RPC...");
        const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');

        const idrAddress = "0xC71168cb6fB6AA39Be28b55BDeDd561D70181477";
        const koperasiAddress = "0x3BE9a134d553De9841f9FB116FE6B290c78C95d6";

        console.log(`Checking Balance of ${koperasiAddress} in rupiah ${idrAddress}...`);
        const idr = new ethers.Contract(idrAddress, abi, provider);

        const bal = await idr.balanceOf(koperasiAddress);
        console.log("---------------------------------------------------");
        console.log("FINAL BALANCE:", bal.toString());
        console.log("---------------------------------------------------");
    } catch (e) {
        console.error("ERROR:", e);
    }
}

main();
