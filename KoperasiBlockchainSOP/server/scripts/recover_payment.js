const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";
const PENDING_REG_FILE = path.join(__dirname, "..", "data", "pending_registrations.json");

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node recover_payment.js <user_address> <amount_idr>");
        process.exit(1);
    }

    const userAddress = args[0].toLowerCase();
    const amountIDR = args[1];
    const amountWei = ethers.parseUnits(amountIDR.toString(), 18);

    console.log(`\n--- FORCE RECOVERY STARTED ---`);
    console.log(`Target Address: ${userAddress}`);
    console.log(`Amount: ${amountIDR} IDR`);

    // 1. Setup Provider/Wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Load REAL ABI
    const abiPath = path.join(__dirname, "..", "..", "src", "abi", "koperasisimpanpinjambaru.json");
    const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    // 2. Load Pending Data (Optional)
    let pendingParams = null;
    try {
        const data = JSON.parse(fs.readFileSync(PENDING_REG_FILE, "utf8"));
        pendingParams = data[userAddress];
    } catch (e) {}

    // STEP 1: Try Register
    if (pendingParams) {
        try {
            console.log(`[1/2] Attempting registration...`);
            const mappedParamsArr = [
                pendingParams.user,
                pendingParams.nama || "Tanpa Nama",
                pendingParams.noHP || "-",
                pendingParams.noKTP || "-",
                pendingParams.alamat || "-",
                pendingParams.gender || pendingParams.jenisKelamin || "-",
                pendingParams.job || pendingParams.pekerjaan || "-",
                pendingParams.emergency || pendingParams.kontakDarurat || "-",
                BigInt(pendingParams.branchId || pendingParams.branchID || 1)
            ];
            const tx1 = await contract.registerMember(mappedParamsArr, { 
                maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
                maxFeePerGas: ethers.parseUnits('50', 'gwei')
            });
            console.log(`Reg Tx Sent: ${tx1.hash}`);
            await tx1.wait();
            console.log(`SUCCESS: Member registered.`);
        } catch (err) {
            console.log(`[!] Registration skipped or failed (likely already registered):`, err.message);
        }
    } else {
        console.log(`[!] No pending data found in JSON, skipping registration step.`);
    }

    // STEP 2: Force Deposit
    try {
        console.log(`[2/2] Attempting force deposit of ${amountIDR} IDR...`);
        const tx2 = await contract.recordDeposit(userAddress, amountWei, true, { 
            maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
            maxFeePerGas: ethers.parseUnits('50', 'gwei')
        });
        console.log(`Deposit Tx Sent: ${tx2.hash}`);
        await tx2.wait();
        console.log(`SUCCESS: Deposit recorded.`);
        
        // Cleanup JSON if exists
        try {
            const data = JSON.parse(fs.readFileSync(PENDING_REG_FILE, "utf8"));
            if (data[userAddress]) {
                delete data[userAddress];
                fs.writeFileSync(PENDING_REG_FILE, JSON.stringify(data, null, 2));
                console.log(`Cleanup success.`);
            }
        } catch(e){}

    } catch (err) {
        console.error(`\nCRITICAL ERROR DURING DEPOSIT:`, err.message);
        process.exit(1);
    }

    console.log(`\n--- FORCE RECOVERY COMPLETED ---`);
}

main();
