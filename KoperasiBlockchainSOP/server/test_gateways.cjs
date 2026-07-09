async function main() {
    const hash = "QmSw5DsMH4YyoTdYMkPUEJFZRnE4dLxzSjAPFmhfYCMoEK";
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/`,
        `https://cloudflare-ipfs.com/ipfs/`,
        `https://ipfs.io/ipfs/`
    ];
    
    for (const gw of gateways) {
        const url = `${gw}${hash}`;
        console.log(`Trying gateway: ${url}`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Content length: ${text.length}`);
            console.log(`Content snippet: ${text.substring(0, 300)}`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

main();
