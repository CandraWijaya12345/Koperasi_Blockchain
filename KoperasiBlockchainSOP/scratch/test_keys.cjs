const crypto = require('crypto');

const list = [
    { name: "Kusuma", ciphertext: "eb888d94d20a882be0f60eb2a083854a:e1d43ba70d01204024af7d6c91c58ae6" },
    { name: "Candra", ciphertext: "499ca99a2c2886bb943d89387deb6cbf:e8bc4c72dc7fedcf993134488fe158f7" },
    { name: "Other", ciphertext: "654d545a1c53256953fad16213c2679f:baf202cc863e799b41cdd936eda4110c" }
];

const rawKey = "9ed6e4ac1009f19d2fb079b52f249fe97bb04a778e184a1c2e934c8e03dd63fc";

function tryDecrypt(cipherText, rawKey) {
    const parts = cipherText.split(':');
    if (parts.length < 2) return { success: false, error: "invalid format" };
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.createHash('sha256').update(rawKey).digest();

    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return { success: true, decrypted };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

for (const item of list) {
    const res = tryDecrypt(item.ciphertext, rawKey);
    console.log(`Label: "${item.name}" -> Success: ${res.success}, Result: "${res.decrypted || res.error}"`);
}
