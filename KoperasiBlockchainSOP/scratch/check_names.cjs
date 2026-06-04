const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));

const { ethers } = require('ethers');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function main() {
    const rpcUrl = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const koperasiAddress = process.env.CONTRACT_ADDRESS || "0x3BE9a134d553De9841f9FB116FE6B290c78C95d6";
    
    const abi = [
        "function getAllMembers() external view returns (address[] memory addresses, tuple(bool terdaftar, uint8 status, string nama, string profileHash, uint256 simpananPokok, uint256 simpananWajib, uint256 simpananSukarela, uint256 shuSudahDiambil, uint256 branchID, uint256 limitPinjaman)[] memory members)"
    ];
    const contract = new ethers.Contract(koperasiAddress, abi, provider);
    
    try {
        console.log("[Script] Fetching members from Koperasi...");
        const [addresses, members] = await contract.getAllMembers();
        console.log(`[Script] Found ${members.length} members.`);
        
        members.forEach((m, i) => {
            console.log(`Member #${i}: Address: ${addresses[i]}, Name: "${m.nama}", Hash: "${m.profileHash}"`);
        });
    } catch (err) {
        console.error("Gagal fetch data members:", err.message);
    }
}

main();
