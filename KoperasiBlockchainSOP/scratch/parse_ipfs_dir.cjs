const hash = "QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT";

async function parseDir() {
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const html = await res.text();
            console.log("HTML length:", html.length);
            
            // Find all links or table rows containing filenames
            const hrefs = [];
            const regex = /href="([^"]+)"/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                hrefs.push(match[1]);
            }
            console.log("Found links:", hrefs);
        } else {
            console.log("Failed to fetch:", res.status);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

parseDir();
