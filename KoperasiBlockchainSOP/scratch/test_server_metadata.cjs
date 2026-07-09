const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env'), override: true });

const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY;
if (!ADMIN_KEY) {
    console.error("Missing ADMIN_PRIVATE_KEY");
    process.exit(1);
}

const JWT_SECRET = crypto.createHash('sha256').update(`jwt_${ADMIN_KEY}`).digest('hex');
const userAddress = "0xeb086198637DF4033098B45F786eeb425270FaCA".toLowerCase();
const token = jwt.sign({ address: userAddress }, JWT_SECRET, { expiresIn: '1h' });

const hash = "QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT";
const url = `http://localhost:5000/api/ipfs/metadata/${hash}/${userAddress}`;

async function testServer() {
    console.log("Calling local server metadata API...");
    console.log("URL:", url);
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("Response Status:", res.status);
        const body = await res.json();
        console.log("Response Body:", JSON.stringify(body, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }
}

testServer();
