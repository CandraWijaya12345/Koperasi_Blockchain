// Native fetch is global
const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const cryptoUtil = require('../server/utils/crypto');

async function main() {
    const url = "https://gateway.pinata.cloud/ipfs/QmSw5DsMH4YyoTdYMkPUEJFZRnE4dLxzSjAPFmhfYCMoEK/ktp_0xb0760ccab9a66d8529e80b3ec3e17f3c7d8e1c3c";
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Response Status:", res.status);
        console.log("Is HTML:", text.includes('<html>') || text.includes('<!DOCTYPE'));
        console.log("Content Preview (first 500 chars):", text.substring(0, 500));
        
        // Try decrypting as if it is the direct identity.json file
        try {
            const dec = cryptoUtil.decryptText(text);
            console.log("\nDecrypted directly successfully!");
            console.log(dec.substring(0, 500));
        } catch (decErr) {
            console.log("\nDirect decryption failed:", decErr.message);
        }
        
        // Let's try fetching the identity.json inside it if it's a folder
        const subUrl = url + "/identity.json";
        console.log("\nFetching sub-path:", subUrl);
        const subRes = await fetch(subUrl);
        const subText = await subRes.text();
        console.log("Sub-path Status:", subRes.status);
        try {
            const dec = cryptoUtil.decryptText(subText);
            console.log("\nDecrypted sub-path successfully!");
            console.log(dec);
        } catch (decErr) {
            console.log("\nSub-path decryption failed:", decErr.message);
        }
    } catch (e) {
        console.error(e);
    }
}
main();
