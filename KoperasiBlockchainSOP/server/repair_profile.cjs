const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const { uploadDirectoryToIPFS } = require('./utils/ipfs');
const cryptoUtil = require('./utils/crypto');

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';

async function main() {
    try {
        const userAddress = "0xb0760ccab9a66d8529e80b3ec3e17f3c7d8e1c3c";
        console.log(`\n--- REPAIR PROFILE FOR ${userAddress} ---`);

        // 1. Fetch current encrypted KTP photo from IPFS
        const photoUrl = "https://ipfs.io/ipfs/QmfNFV9kcpFEbYmn9LsX7pbt7hDpd7MA1FLGshuRoUUryr/ktp_0xb0760ccab9a66d8529e80b3ec3e17f3c7d8e1c3c";
        console.log(`Fetching existing photo from IPFS: ${photoUrl}...`);
        const photoRes = await fetch(photoUrl);
        if (!photoRes.ok) {
            throw new Error(`Failed to fetch photo from IPFS, status: ${photoRes.status}`);
        }
        const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
        console.log(`Photo fetched successfully: ${photoBuffer.length} bytes.`);

        // 2. Prepare files list for the new directory
        const filesList = [];
        const userAddressLower = userAddress.toLowerCase();

        // Push photo with the correct relative path in the directory
        filesList.push({
            buffer: photoBuffer,
            filepath: `koperasi_ktp/ktp_${userAddressLower}`
        });

        // 3. Prepare decrypted/encrypted metadata JSON
        const ipfsPayload = {
            nama: "Candra Wijaya",
            noHP: "081234567890",
            noKTP: "3171012345678901",
            alamat: "Jl. Mawar Indah No. 12, Jakarta",
            gender: "Laki-laki",
            job: "Wirausaha",
            emergency: "Emergency Contact (081298765432)",
            photoHash: `ktp_${userAddressLower}`,
            timestamp: new Date().toISOString()
        };

        const encryptedJsonText = cryptoUtil.encryptText(JSON.stringify(ipfsPayload, null, 2));
        const jsonBuffer = Buffer.from(encryptedJsonText);

        filesList.push({
            buffer: jsonBuffer,
            filepath: `koperasi_ktp/identity.json`
        });

        // 4. Upload directory to IPFS
        console.log("Uploading folder to IPFS via Pinata...");
        const jsonHash = await uploadDirectoryToIPFS(filesList);
        console.log("Folder uploaded successfully! Root CID:", jsonHash);

        // 5. Connect to Polygon blockchain
        console.log("Connecting to blockchain...");
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        const abiPath = path.join(__dirname, '../src/abi/koperasisimpanpinjambaru.json');
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

        // 6. Execute updateMemberProfile on the contract
        console.log("Sending updateMemberProfile transaction...");
        const encryptedNameOnChain = cryptoUtil.encryptText("Candra Wijaya");
        
        // Define Gas overrides
        const gasOptions = {
            maxPriorityFeePerGas: ethers.parseUnits('90', 'gwei'),
            maxFeePerGas: ethers.parseUnits('400', 'gwei')
        };

        const tx = await contract.updateMemberProfile(userAddress, encryptedNameOnChain, jsonHash, gasOptions);
        console.log(`Transaction sent! Hash: ${tx.hash}`);
        console.log("Waiting for transaction confirmation...");
        await tx.wait();
        console.log("PROFILE REPAIRED SUCCESSFULLY ON-CHAIN!");

    } catch (e) {
        console.error("ERROR DURING REPAIR:", e);
    }
}

main();
