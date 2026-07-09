const path = require("path");
const fs = require("fs");

const serverNodeModules = path.join(__dirname, "..", "server", "node_modules");
const solc = require(path.join(serverNodeModules, "solc"));
const { ethers } = require(path.join(serverNodeModules, "ethers"));
const dotenv = require(path.join(serverNodeModules, "dotenv"));

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, "..", "server", ".env") });

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/";

if (!PRIVATE_KEY) {
    console.error("ADMIN_PRIVATE_KEY is missing from environment variables.");
    process.exit(1);
}

// Paths
const contractPath = path.join(__dirname, "..", "src", "Reconstructed_KoperasiSimpanPinjam.sol");
const abiOutputPath = path.join(__dirname, "..", "src", "abi", "koperasisimpanpinjambaru.json");
const constantsPath = path.join(__dirname, "..", "src", "utils", "constants.js");
const serverEnvPath = path.join(__dirname, "..", "server", ".env");

function findImports(importPath) {
    try {
        let fullPath;
        if (importPath.startsWith("@openzeppelin/")) {
            fullPath = path.resolve(__dirname, "..", "server", "node_modules", importPath);
        } else {
            fullPath = path.resolve(__dirname, "..", "src", importPath);
        }
        
        if (fs.existsSync(fullPath)) {
            return { contents: fs.readFileSync(fullPath, "utf8") };
        } else {
            // Try inside node_modules directory in root if it exists
            const rootNodeModulesPath = path.resolve(__dirname, "..", "node_modules", importPath);
            if (fs.existsSync(rootNodeModulesPath)) {
                return { contents: fs.readFileSync(rootNodeModulesPath, "utf8") };
            }
            return { error: `File not found: ${fullPath}` };
        }
    } catch (e) {
        return { error: e.message };
    }
}

async function main() {
    console.log("Reading contract file...");
    const sourceCode = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: "Solidity",
        sources: {
            "Reconstructed_KoperasiSimpanPinjam.sol": {
                content: sourceCode
            }
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true, // Enable Intermediate Representation to bypass 'Stack too deep'
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"]
                }
            }
        }
    };

    console.log("Compiling smart contract (this may take a moment with viaIR enabled)...");
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    if (output.errors) {
        let hasErrors = false;
        output.errors.forEach(err => {
            console.log(err.severity === "error" ? "ERROR:" : "WARNING:", err.formattedMessage);
            if (err.severity === "error") hasErrors = true;
        });
        if (hasErrors) {
            console.error("Compilation failed due to errors.");
            process.exit(1);
        }
    }

    const contractName = "KoperasiSimpanPinjam";
    const contractData = output.contracts["Reconstructed_KoperasiSimpanPinjam.sol"][contractName];
    
    if (!contractData) {
        console.error(`Contract ${contractName} not found in compilation output.`);
        process.exit(1);
    }

    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    // Connect to blockchain
    console.log(`Connecting to provider: ${RPC_URL}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Deploying from account: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Account Balance: ${ethers.formatEther(balance)} POL`);

    if (balance === 0n) {
        console.error("Deployer balance is 0. Cannot deploy.");
        process.exit(1);
    }

    console.log("Deploying contract...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Generous priority fee and gas options for Polygon Amoy
    const deployTxOptions = {
        maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
        maxFeePerGas: ethers.parseUnits("150", "gwei")
    };
    
    const contractInstance = await factory.deploy(deployTxOptions);
    console.log(`Deploy Tx Sent: ${contractInstance.deploymentTransaction().hash}`);
    
    console.log("Waiting for deployment confirmation...");
    await contractInstance.waitForDeployment();
    
    const deployedAddress = await contractInstance.getAddress();
    console.log(`\n=========================================`);
    console.log(`KoperasiSimpanPinjam Deployed to: ${deployedAddress}`);
    
    // Get SaldoIDR token address
    const tokenAddress = await contractInstance.saldoIDR();
    console.log(`SaldoIDR Token Address: ${tokenAddress}`);
    console.log(`=========================================\n`);

    const deployBlock = await provider.getBlockNumber();
    console.log(`Deployment Block: ${deployBlock}`);

    // Update ABI file
    console.log(`Writing ABI to ${abiOutputPath}...`);
    fs.writeFileSync(abiOutputPath, JSON.stringify({ abi }, null, 2));

    // Update constants.js
    console.log(`Updating ${constantsPath}...`);
    let constantsContent = fs.readFileSync(constantsPath, "utf8");
    constantsContent = constantsContent.replace(
        /export const CONTRACT_ADDRESS = "[^"]+";/,
        `export const CONTRACT_ADDRESS = "${deployedAddress}";`
    );
    constantsContent = constantsContent.replace(
        /export const rupiah_ADDRESS = "[^"]+";/,
        `export const rupiah_ADDRESS = "${tokenAddress}";`
    );
    constantsContent = constantsContent.replace(
        /export const DEPLOY_BLOCK = \d+;/,
        `export const DEPLOY_BLOCK = ${deployBlock};`
    );
    fs.writeFileSync(constantsPath, constantsContent);
    console.log("constants.js updated.");

    // Update server/.env
    console.log(`Updating ${serverEnvPath}...`);
    let envContent = fs.readFileSync(serverEnvPath, "utf8");
    envContent = envContent.replace(
        /CONTRACT_ADDRESS=[^\r\n]+/,
        `CONTRACT_ADDRESS=${deployedAddress}`
    );
    envContent = envContent.replace(
        /TOKEN_ADDRESS=[^\r\n]+/,
        `TOKEN_ADDRESS=${tokenAddress}`
    );
    fs.writeFileSync(serverEnvPath, envContent);
    console.log("server/.env updated.");

    console.log("\nDeployment and configuration complete!");
}

main().catch(err => {
    console.error("Error in main deployment execution:", err);
});
