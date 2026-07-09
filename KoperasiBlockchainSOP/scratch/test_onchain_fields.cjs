const path = require("path");
const fs = require("fs");

const serverNodeModules = path.join(__dirname, "..", "server", "node_modules");
const { ethers } = require(path.join(serverNodeModules, "ethers"));
const dotenv = require(path.join(serverNodeModules, "dotenv"));

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, "..", "server", ".env") });

const cryptoUtil = require(path.join(__dirname, "..", "server", "utils", "crypto.js"));

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.error("ADMIN_PRIVATE_KEY or CONTRACT_ADDRESS is missing.");
    process.exit(1);
}

const abiPath = path.join(__dirname, "..", "src", "abi", "koperasisimpanpinjambaru.json");
const abiData = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const abi = abiData.abi;

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    console.log(`Using contract at: ${CONTRACT_ADDRESS}`);
    console.log(`Admin Wallet: ${wallet.address}`);

    // Generate a random wallet address to register
    const testWallet = ethers.Wallet.createRandom();
    const testAddr = testWallet.address;
    console.log(`Generating random member address for test: ${testAddr}`);

    // Check if storage mode is set to ON-CHAIN (useIPFSStorage = false)
    const ipfsMode = await contract.useIPFSStorage();
    console.log(`Current storage mode: ${ipfsMode ? "IPFS" : "ON-CHAIN"}`);

    if (ipfsMode) {
        console.log("Contract is in IPFS mode. Setting storage mode to ON-CHAIN for this test...");
        const txMode = await contract.setStorageMode(false, {
            maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
            maxFeePerGas: ethers.parseUnits("150", "gwei")
        });
        await txMode.wait();
        console.log("Storage mode updated to ON-CHAIN successfully.");
    }

    // Encrypt fields
    console.log("Encrypting profile fields...");
    const rawNama = "Budiman Sentosa";
    const rawNoHP = "081299998888";
    const rawNoKTP = "3273010101990001";
    const rawAlamat = "Jl. Sudirman No. 45, Bandung";
    const rawGender = "Laki-laki";
    const rawJob = "Wiraswasta";
    const rawEmergency = "Istri Budiman (081299998889)";

    const encryptedNama = cryptoUtil.encryptText(rawNama);
    const encryptedNoHP = cryptoUtil.encryptText(rawNoHP);
    const encryptedNoKTP = cryptoUtil.encryptText(rawNoKTP);
    const encryptedAlamat = cryptoUtil.encryptText(rawAlamat);
    const encryptedGender = cryptoUtil.encryptText(rawGender);
    const encryptedJob = cryptoUtil.encryptText(rawJob);
    const encryptedEmergency = cryptoUtil.encryptText(rawEmergency);

    console.log(`Encrypted Nama: ${encryptedNama}`);
    console.log(`Encrypted NoHP: ${encryptedNoHP}`);

    // Call registerMember
    console.log("Registering member...");
    const params = [
        testAddr,
        encryptedNama,
        "NONE", // profileHash placeholder for onchain
        1n,     // branchId
        encryptedNoHP,
        encryptedNoKTP,
        encryptedAlamat,
        encryptedGender,
        encryptedJob,
        encryptedEmergency
    ];

    const txReg = await contract.registerMember(params, {
        maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
        maxFeePerGas: ethers.parseUnits("150", "gwei")
    });
    console.log(`Register transaction sent: ${txReg.hash}`);
    await txReg.wait();
    console.log("Register transaction confirmed.");

    // Query dataAnggota
    console.log("Retrieving member data from blockchain...");
    const data = await contract.dataAnggota(testAddr);
    
    // Output tuple elements to see all returned fields
    console.log(`Returned elements count: ${data.length || Object.keys(data).length}`);

    // Map fields
    const namaFromChain = data.nama || data[2] || "";
    const noHPFromChain = data.noHP || data[10] || "";
    const noKTPFromChain = data.noKTP || data[11] || "";
    const alamatFromChain = data.alamat || data[12] || "";
    const genderFromChain = data.gender || data[13] || "";
    const jobFromChain = data.job || data[14] || "";
    const emergencyFromChain = data.emergency || data[15] || "";

    console.log("\n--- Encrypted values from chain ---");
    console.log(`Nama: ${namaFromChain}`);
    console.log(`noHP: ${noHPFromChain}`);
    console.log(`noKTP: ${noKTPFromChain}`);
    console.log(`alamat: ${alamatFromChain}`);
    console.log(`gender: ${genderFromChain}`);
    console.log(`job: ${jobFromChain}`);
    console.log(`emergency: ${emergencyFromChain}`);

    console.log("\n--- Decrypting values ---");
    const decNama = cryptoUtil.decryptText(namaFromChain);
    const decNoHP = cryptoUtil.decryptText(noHPFromChain);
    const decNoKTP = cryptoUtil.decryptText(noKTPFromChain);
    const decAlamat = cryptoUtil.decryptText(alamatFromChain);
    const decGender = cryptoUtil.decryptText(genderFromChain);
    const decJob = cryptoUtil.decryptText(jobFromChain);
    const decEmergency = cryptoUtil.decryptText(emergencyFromChain);

    console.log(`Decrypted Nama: ${decNama} (Expected: ${rawNama})`);
    console.log(`Decrypted NoHP: ${decNoHP} (Expected: ${rawNoHP})`);
    console.log(`Decrypted NoKTP: ${decNoKTP} (Expected: ${rawNoKTP})`);
    console.log(`Decrypted Alamat: ${decAlamat} (Expected: ${rawAlamat})`);
    console.log(`Decrypted Gender: ${decGender} (Expected: ${rawGender})`);
    console.log(`Decrypted Job: ${decJob} (Expected: ${rawJob})`);
    console.log(`Decrypted Emergency: ${decEmergency} (Expected: ${rawEmergency})`);

    const allMatch = 
        decNama === rawNama &&
        decNoHP === rawNoHP &&
        decNoKTP === rawNoKTP &&
        decAlamat === rawAlamat &&
        decGender === rawGender &&
        decJob === rawJob &&
        decEmergency === rawEmergency;

    if (allMatch) {
        console.log("\nSUCCESS: All fields correctly decrypted and match original values!");
    } else {
        console.error("\nFAILURE: Mismatch in decrypted fields!");
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Error running test script:", err);
});
