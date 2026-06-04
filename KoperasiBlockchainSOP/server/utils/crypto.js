const crypto = require('crypto');

// Derive a 32-byte key from the ADMIN_PRIVATE_KEY for AES-256
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || 'default_secret_key_for_development_purposes_only_32_bytes';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ADMIN_PRIVATE_KEY).digest();
const ALGORITHM = 'aes-256-cbc';

function encryptText(text) {
    if (!text) return "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decryptText(encryptedText) {
    if (!encryptedText) return "";
    // If it doesn't contain a colon, it's not encrypted
    if (!encryptedText.includes(':')) {
        return encryptedText;
    }
    
    const parts = encryptedText.split(':');
    const ivHex = parts[0];
    const encryptedHex = parts[1] || "";
    
    // An IV for AES-256-CBC is 16 bytes, which is exactly 32 hex characters.
    // Also check if both parts are valid hexadecimal strings.
    const hexRegex = /^[0-9a-fA-F]+$/;
    const isEncryptedFormat = ivHex.length === 32 && hexRegex.test(ivHex) && hexRegex.test(encryptedHex);
    
    if (!isEncryptedFormat) {
        return encryptedText; // Quietly return plain text (no warning!)
    }
    
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.warn("[Crypto] Decryption failed, returning plain text:", err.message);
        return encryptedText; // Fallback
    }
}

function encryptBuffer(buffer) {
    if (!buffer) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
}

function decryptBuffer(encryptedBuffer) {
    if (!encryptedBuffer) return null;
    try {
        // If the buffer is too small, it's not encrypted (legacy plain text)
        if (encryptedBuffer.length < 17) {
            return encryptedBuffer;
        }
        const iv = encryptedBuffer.subarray(0, 16);
        const encrypted = encryptedBuffer.subarray(16);
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (err) {
        console.warn("[Crypto] Buffer decryption failed, returning raw buffer:", err.message);
        return encryptedBuffer; // Fallback
    }
}

module.exports = {
    encryptText,
    decryptText,
    encryptBuffer,
    decryptBuffer
};
