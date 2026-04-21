const { ethers } = require('ethers');

async function main() {
    const rpcUrl = "https://rpc-amoy.polygon.technology/";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = "9ed6e4ac1009f19d2fb079b52f249fe97bb04a778e184a1c2e934c8e03dd63fc";
    const wallet = new ethers.Wallet(privateKey, provider);
    const koperasiAddress = "0xD2530547B22dE9C45fE0AEcd0af421fBB29C6d6f";
    
    // ABI for updateGlobalSettings and settings
    const abi = [
        "function settings() view returns (bool, bool, bool, bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
        "function updateGlobalSettings((bool, bool, bool, bool, uint256, uint256, uint256, uint256, uint256, uint256) p) external"
    ];
    const contract = new ethers.Contract(koperasiAddress, abi, wallet);
    
    try {
        const current = await contract.settings();
        console.log("Current Pokok:", current[4].toString());
        
        const newPokok = ethers.parseUnits("150000", 18);
        console.log("Setting to:", newPokok.toString());
        
        const pArray = [
            current[0], current[1], current[2], current[3],
            newPokok, current[5], current[6], current[7], current[8], current[9]
        ];
        
        console.log("Sending Tx...");
        const tx = await contract.updateGlobalSettings(pArray, {
            maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
            maxFeePerGas: ethers.parseUnits('50', 'gwei')
        });
        console.log("Tx Sent:", tx.hash);
        await tx.wait();
        console.log("Tx Confirmed!");
        
        const updated = await contract.settings();
        console.log("Updated Pokok:", updated[4].toString());
        
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
