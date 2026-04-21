const { ethers } = require('ethers');

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const koperasiAddress = "0xD2530547B22dE9C45fE0AEcd0af421fBB29C6d6f";
    
    const abi = [
        "function settings() view returns (bool, bool, bool, bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256)"
    ];
    const contract = new ethers.Contract(koperasiAddress, abi, provider);
    
    try {
        const setts = await contract.settings();
        console.log("Settings Raw:", setts);
        console.log("Settings [4]:", setts[4]);
        
        if (setts.nominalSimpananPokok) {
            console.log("Settings.nominalSimpananPokok:", setts.nominalSimpananPokok);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
