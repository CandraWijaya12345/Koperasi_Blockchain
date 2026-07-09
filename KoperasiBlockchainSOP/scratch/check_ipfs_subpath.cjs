const hash = "QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT";
const subpath = "wijaya_rusdi_2026-06-23_0xeb086198637df4033098b45f786eeb425270faca";

async function checkSubpath() {
    // 1. Try to fetch the subfolder as HTML directory index
    const url = `https://gateway.pinata.cloud/ipfs/${hash}/${subpath}`;
    try {
        console.log("Fetching subpath:", url);
        const res = await fetch(url);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Content-Type:", res.headers.get('content-type'));
        console.log("Snippet:", text.substring(0, 500));
    } catch (e) {
        console.log("Error:", e.message);
    }
}

checkSubpath();
