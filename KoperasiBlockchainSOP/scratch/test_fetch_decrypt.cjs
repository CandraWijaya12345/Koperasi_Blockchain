const path = require('path');
const fs = require('fs');

module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const cryptoUtil = require('../server/utils/crypto');

async function fetchFromIPFSGateways(hash, subPath = "") {
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/`,
        `https://cloudflare-ipfs.com/ipfs/`,
        `https://ipfs.io/ipfs/`
    ];

    for (const gw of gateways) {
        const url = `${gw}${hash}${subPath ? '/' + subPath : ''}`;
        try {
            console.log(`[Script] Trying gateway: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                return { ok: true, text };
            }
        } catch (e) {
            console.warn(`Gateway ${gw} failed:`, e.message);
        }
    }
    return { ok: false };
}

async function testMember(address, nameCipher, hash) {
    console.log(`\n==========================================`);
    console.log(`Testing Member address: ${address}`);
    console.log(`IPFS Hash: ${hash}`);

    const ipfsResult = await fetchFromIPFSGateways(hash);
    if (!ipfsResult.ok) {
        console.error(`Failed to fetch main hash.`);
        return;
    }

    const text = ipfsResult.text;
    
    // Check if it's directory list
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        console.log("It is an IPFS directory listing (HTML).");
        
        // Find all links
        const regex = /href="([^"]+)"/g;
        let match;
        const links = [];
        while ((match = regex.exec(text)) !== null) {
            const l = match[1];
            if (!l.includes('..') && !l.startsWith('?') && !l.includes('ipfs')) {
                links.push(l);
            }
        }
        console.log("Found links in directory:", links);

        const userAddressLower = address.toLowerCase();
        
        // Find any link containing the user's address
        const userLink = links.find(l => l.toLowerCase().includes(userAddressLower));
        if (userLink) {
            console.log(`Matching directory link found for address: ${userLink}`);
            const targetPath = `${userLink}identity.json`;
            console.log(`Fetching: ${targetPath}`);
            const subRes = await fetchFromIPFSGateways(hash, targetPath);
            if (subRes.ok) {
                const encJson = subRes.text;
                try {
                    const decJson = cryptoUtil.decryptText(encJson);
                    console.log(`Decrypted JSON successfully!`);
                    console.log(decJson);
                } catch (decErr) {
                    console.error(`Decryption failed:`, decErr.message);
                }
            } else {
                console.error(`Failed to fetch: ${targetPath}`);
            }
        } else {
            console.log(`No link found containing address: ${userAddressLower}`);
        }
    } else {
        console.log("It is a direct file.");
        try {
            const decJson = cryptoUtil.decryptText(text);
            console.log(`Decrypted JSON:`, decJson);
        } catch (decErr) {
            console.error(`Decryption failed for direct file:`, decErr.message);
        }
    }
}

async function main() {
    // 0xB0760cCab9a66D8529e80B3Ec3E17f3c7D8E1C3c
    await testMember(
        "0xB0760cCab9a66D8529e80B3Ec3E17f3c7D8E1C3c", 
        "654d545a1c53256953fad16213c2679f:baf202cc863e799b41cdd936eda4110c", 
        "QmSw5DsMH4YyoTdYMkPUEJFZRnE4dLxzSjAPFmhfYCMoEK"
    );
}

main();
