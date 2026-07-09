import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        console.log("Loading ABI...");
        const abiPath = path.join(__dirname, 'src/abi/idrABI.json');
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

        console.log("Connecting to RPC...");
        const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');

        const idrAddress = "0x04bF97698f17A6c747Bb4062a1E95e1aB4C2498E";
        const koperasiAddress = "0x947382476c37C987Fda55fbf3681b10E08328099";

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
