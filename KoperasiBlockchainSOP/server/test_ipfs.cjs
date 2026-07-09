async function main() {
    try {
        const url = "https://ipfs.io/ipfs/QmfNFV9kcpFEbYmn9LsX7pbt7hDpd7MA1FLGshuRoUUryr";
        console.log("Fetching IPFS directly:", url);
        const res = await fetch(url);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Content links:");
        const regex = /href="([^"]+)"/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            console.log(match[1]);
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
}

main();
