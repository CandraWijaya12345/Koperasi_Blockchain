const { ethers } = require('ethers');
const fs = require('fs');

const RPC_URL = 'https://rpc-amoy.polygon.technology/';
const CONTRACT_ADDRESS = '0xe90dD66F48dE541afc3a5B756d8058021F5Cf0ED';

const ABI = JSON.parse(fs.readFileSync('./src/abi/koperasisimpanpinjambaru.json', 'utf8'));

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    console.log("Checking current settings...");
    const current = await contract.settings();
    console.log("Raw settings from contract:", current);
    
    // Check if it's an object or array (Ethers Result)
    console.log("--- Structure Check ---");
    console.log("current[0]:", current[0]);
    console.log("current[4]:", current[4]);
    
    // Named properties (if object)
    console.log("current.autoCollectibility:", current.autoCollectibility);
    console.log("current.nominalSimpananPokok:", current.nominalSimpananPokok);

    const isNumericIndexMissing = current[0] === undefined;
    const isNamedPropertyMissing = current.nominalSimpananPokok === undefined;

    if (isNumericIndexMissing && !isNamedPropertyMissing) {
        console.log("RESULT: Contract settings returns an OBJECT (Named properties only). Backend using current[index] will fail.");
    } else if (!isNumericIndexMissing && isNamedPropertyMissing) {
         console.log("RESULT: Contract settings returns an ARRAY/RESULT (Numeric indices only).");
    } else {
         console.log("RESULT: Contract settings returns a HYBRID or something else.");
    }
}

main();
