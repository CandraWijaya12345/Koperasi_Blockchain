// Native fetch is global
async function checkHash(name, hash) {
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    try {
        const res = await fetch(url);
        const text = await res.status === 200 ? await res.text() : "";
        console.log(`\n==========================================`);
        console.log(`Member: ${name}, Hash: ${hash}`);
        if (!text) {
            console.log("Failed to fetch HTML.");
            return;
        }
        const regex = /href="([^"]+)"/g;
        let match;
        const links = [];
        while ((match = regex.exec(text)) !== null) {
            const l = match[1];
            if (!l.includes('..') && !l.startsWith('?') && !l.includes('data:')) {
                links.push(l);
            }
        }
        console.log("Links found:", links);
    } catch (e) {
        console.error("Error for", name, e.message);
    }
}

async function main() {
    await checkHash("Kusuma", "QmVf5Dw3Kx6q7dApBcBaJgw4Y66VJ4WnLHGzs2BuyZba8i");
    await checkHash("Ujang", "QmTQG9SVFYVei59uhY3WcfD9PcXMPRyNVLdbpnUA4ELps6");
}
main();
