async function main() {
    try {
        const hash = "QmSw5DsMH4YyoTdYMkPUEJFZRnE4dLxzSjAPFmhfYCMoEK";
        const address = "0xb0760ccab9a66d8529e80b3ec3e17f3c7d8e1c3c";
        const url = `http://localhost:5000/api/ipfs/metadata/${hash}/${address}`;
        console.log("Fetching:", url);
        const res = await fetch(url);
        console.log("Status:", res.status);
        const json = await res.json();
        console.log("JSON:", JSON.stringify(json, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}

main();
