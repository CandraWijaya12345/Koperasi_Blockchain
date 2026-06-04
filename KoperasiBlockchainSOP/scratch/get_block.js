import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');
provider.getBlockNumber().then(console.log).catch(console.error);
