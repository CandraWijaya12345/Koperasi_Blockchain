import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function check() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Address: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);
}
check();
