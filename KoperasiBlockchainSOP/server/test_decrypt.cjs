const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ADMIN_PRIVATE_KEY).digest();
const ALGORITHM = 'aes-256-cbc';

function decryptText(encryptedText) {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedHex = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

try {
    const text = "b30731201c5e94d1413da5cda8bcef7b:c0bfe0604f6346f39f286bee40b5cbb6";
    console.log("Decrypted:", decryptText(text));
} catch (e) {
    console.error("ERROR:", e);
}
