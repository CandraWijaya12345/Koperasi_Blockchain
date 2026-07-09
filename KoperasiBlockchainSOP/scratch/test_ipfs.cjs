const hash = "QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT";
const gateways = [
    `https://gateway.pinata.cloud/ipfs/`,
    `https://cloudflare-ipfs.com/ipfs/`,
    `https://ipfs.io/ipfs/`
];

async function testGateways() {
    console.log(`Testing IPFS fetch for hash: ${hash}`);
    for (const gw of gateways) {
        const url = `${gw}${hash}`;
        try {
            console.log(`Fetching from: ${url}`);
            const res = await fetch(url);
            console.log(`  Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`  Content length: ${text.length}`);
                console.log(`  Snippet: ${text.substring(0, 100)}`);
            } else {
                const text = await res.text();
                console.log(`  Error body: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }
}

testGateways();
