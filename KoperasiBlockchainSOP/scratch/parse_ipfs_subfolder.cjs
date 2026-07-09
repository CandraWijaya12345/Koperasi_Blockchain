const hash = "QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT";
const subpath = "wijaya_rusdi_2026-06-23_0xeb086198637df4033098b45f786eeb425270faca";

async function parseSubfolder() {
    const url = `https://gateway.pinata.cloud/ipfs/${hash}/${subpath}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const html = await res.text();
            console.log("HTML length:", html.length);
            
            const hrefs = [];
            const regex = /href="([^"]+)"/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                hrefs.push(match[1]);
            }
            console.log("Found links in subfolder:", hrefs);
        } else {
            console.log("Failed to fetch subfolder:", res.status);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

parseSubfolder();
