// Native fetch is global
async function main() {
    const url = "https://gateway.pinata.cloud/ipfs/QmSw5DsMH4YyoTdYMkPUEJFZRnE4dLxzSjAPFmhfYCMoEK";
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("HTML length:", text.length);
        console.log("First 1000 chars:");
        console.log(text.substring(0, 1000));
        console.log("Last 1000 chars:");
        console.log(text.substring(text.length - 1000));
    } catch (e) {
        console.error(e);
    }
}
main();
