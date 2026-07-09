const { ethers } = require('ethers');

async function main() {
    try {
        console.log("Connecting to RPC...");
        const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');

        const koperasiAddress = "0x947382476c37C987Fda55fbf3681b10E08328099";
        const userAddress = "0xb0760ccab9a66d8529e80b3ec3e17f3c7d8e1c3c";

        console.log(`Checking Member Status of ${userAddress} on contract ${koperasiAddress}...`);
        
        // Define minimal ABI for dataAnggota
        const abi = [
            "function dataAnggota(address) view returns (bool terdaftar, uint8 status, string nama, string profileHash, uint256 simpananPokok, uint256 simpananWajib, uint256 simpananSukarela, uint256 shuSudahDiambil, uint256 branchID, uint256 limitPinjaman, uint256 idPinjamanAktif)"
        ];

        const contract = new ethers.Contract(koperasiAddress, abi, provider);

        const member = await contract.dataAnggota(userAddress);
        console.log("---------------------------------------------------");
        console.log("terdaftar:", member.terdaftar);
        console.log("status:", member.status);
        console.log("nama:", member.nama);
        console.log("profileHash:", member.profileHash);
        console.log("simpananPokok:", member.simpananPokok.toString());
        console.log("simpananWajib:", member.simpananWajib.toString());
        console.log("simpananSukarela:", member.simpananSukarela.toString());
        console.log("shuSudahDiambil:", member.shuSudahDiambil.toString());
        console.log("branchID:", member.branchID.toString());
        console.log("limitPinjaman:", member.limitPinjaman.toString());
        console.log("idPinjamanAktif:", member.idPinjamanAktif.toString());
        console.log("---------------------------------------------------");
    } catch (e) {
        console.error("ERROR:", e);
    }
}

main();
