const path = require('path');
// Dynamically add server's node_modules to support running from any directory
module.paths.push(path.join(__dirname, '../server/node_modules'));

const { ethers } = require('ethers');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function main() {
    const rpcUrl = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    const koperasiAddress = process.env.CONTRACT_ADDRESS || "0x3BE9a134d553De9841f9FB116FE6B290c78C95d6";
    
    if (!privateKey) {
        console.error("Error: ADMIN_PRIVATE_KEY is missing in server/.env");
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const abi = [
        "function useIPFSStorage() view returns (bool)",
        "function setStorageMode(bool _useIPFS) external"
    ];
    const contract = new ethers.Contract(koperasiAddress, abi, wallet);
    
    try {
        const currentMode = await contract.useIPFSStorage();
        console.log(`[Status] Mode Penyimpanan Saat Ini: ${currentMode ? "IPFS (Tersentralisasi/GDPR-compliant)" : "ON-CHAIN (Full Blockchain)"}`);
        
        // Ambil argumen command line
        const args = process.argv.slice(2);
        if (args.length === 0) {
            console.log("\nUntuk mengubah mode penyimpanan, silakan jalankan perintah:");
            console.log("  node scratch/set_storage_mode.cjs true   (Mengaktifkan Mode IPFS)");
            console.log("  node scratch/set_storage_mode.cjs false  (Mengaktifkan Mode ON-CHAIN)\n");
            return;
        }
        
        const targetMode = args[0] === 'true';
        if (targetMode === currentMode) {
            console.log(`[Info] Kontrak sudah berada di mode ${targetMode ? "IPFS" : "ON-CHAIN"}. Tidak ada perubahan.`);
            return;
        }
        
        console.log(`[Blockchain] Mengubah Mode Penyimpanan ke: ${targetMode ? "IPFS" : "ON-CHAIN"}...`);
        const tx = await contract.setStorageMode(targetMode, {
            maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
            maxFeePerGas: ethers.parseUnits('50', 'gwei')
        });
        
        console.log(`[Transaksi] Terkirim: ${tx.hash}`);
        console.log("[Sistem] Menunggu konfirmasi jaringan...");
        await tx.wait();
        console.log("[Sukses] Mode penyimpanan berhasil diperbarui di Blockchain!");
        
        const updatedMode = await contract.useIPFSStorage();
        console.log(`[Status Baru] Mode Penyimpanan: ${updatedMode ? "IPFS" : "ON-CHAIN"}`);
    } catch (err) {
        console.error("Gagal memperbarui mode penyimpanan:", err.message);
    }
}

main();
