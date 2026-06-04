const { ethers } = require('ethers');

async function checkTokenAddress() {
    const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
    // Address smart contract koperasi terbaru yang Anda sebutkan
    const contractAddr = "0x3BE9a134d553De9841f9FB116FE6B290c78C95d6";
    
    // ABI minimal untuk mengambil variabel saldoIDR dan useIPFSStorage
    const abi = [
        'function saldoIDR() view returns (address)',
        'function useIPFSStorage() view returns (bool)',
        'function owner() view returns (address)'
    ];
    
    const contract = new ethers.Contract(contractAddr, abi, provider);
    
    console.log(`Menghubungi kontrak Koperasi di: ${contractAddr}...`);
    try {
        const tokenAddr = await contract.saldoIDR();
        const ipfsMode = await contract.useIPFSStorage();
        const ownerAddr = await contract.owner();
        
        console.log("\nHasil Diagnostik:");
        console.log("--------------------------------------------------");
        console.log(" - Address Koperasi Simpan Pinjam  :", contractAddr);
        console.log(" - Address Kontrak SaldoIDR (ERC20):", tokenAddr);
        console.log(" - Owner (Admin) Kontrak Koperasi  :", ownerAddr);
        console.log(" - Status Mode IPFS saat ini       :", ipfsMode ? "AKTIF (IPFS)" : "NONAKTIF (On-Chain)");
        console.log("--------------------------------------------------");
        console.log("\nSukses! Address SaldoIDR terdeteksi di atas.");
    } catch (err) {
        console.error("\nError saat membaca data dari Smart Contract:", err.message);
        console.log("\nTip: Pastikan kontrak sudah ter-deploy dengan benar di Polygon Amoy Testnet!");
    }
}

checkTokenAddress();
