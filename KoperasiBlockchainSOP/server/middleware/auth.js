/**
 * Authentication & Authorization Middleware
 * 
 * Uses JWT Session Tokens derived from MetaMask login signature.
 * Zero additional popups — token is issued once at login and reused.
 */

const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret: derived from ADMIN_PRIVATE_KEY to avoid adding another env var
// In production, use a separate JWT_SECRET env variable
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY || 'fallback_dev_key';
const JWT_SECRET = crypto.createHash('sha256').update(`jwt_${ADMIN_KEY}`).digest('hex');
const JWT_EXPIRY = '24h';

/**
 * Issue a JWT token after verifying wallet signature
 */
function issueToken(walletAddress) {
    return jwt.sign(
        { address: walletAddress.toLowerCase() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Verify a login signature and return a JWT token
 */
function verifyLoginSignature(address, message, signature) {
    try {
        const recovered = ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return { valid: false, error: 'Signature does not match address' };
        }
        const token = issueToken(address);
        return { valid: true, token };
    } catch (err) {
        return { valid: false, error: 'Invalid signature: ' + err.message };
    }
}

/**
 * Middleware: Verify JWT token from Authorization header
 * Sets req.verifiedAddress on success
 */
function requireAuth(req, res, next) {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Token autentikasi tidak ditemukan' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.verifiedAddress = decoded.address; // lowercase
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesi telah berakhir, silakan login ulang', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

/**
 * Middleware: Verify the caller is an admin (pengurus) on the blockchain
 * Must be used AFTER requireAuth
 */
function requireAdmin(contract) {
    return async (req, res, next) => {
        if (!req.verifiedAddress) {
            return res.status(401).json({ error: 'Tidak terautentikasi' });
        }
        try {
            const isAdmin = await contract.isPengurus(req.verifiedAddress);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Akses ditolak: bukan pengurus koperasi' });
            }
            next();
        } catch (err) {
            console.error('[Auth] Admin verification failed:', err.message);
            return res.status(500).json({ error: 'Gagal memverifikasi status admin' });
        }
    };
}

/**
 * Middleware: Verify the caller is operating on their own account
 * Checks req.body.userAddress OR req.body.params.user against req.verifiedAddress
 * Must be used AFTER requireAuth
 */
function requireOwnership(req, res, next) {
    const bodyAddress = (
        req.body.userAddress ||
        (req.body.params && req.body.params.user) ||
        ''
    ).toLowerCase();

    if (!bodyAddress) {
        // Some endpoints don't have userAddress in body, skip ownership check
        return next();
    }

    if (bodyAddress !== req.verifiedAddress) {
        return res.status(403).json({
            error: 'Anda hanya bisa melakukan operasi untuk akun sendiri'
        });
    }
    next();
}

/**
 * Middleware: Verify Xendit webhook callback token
 */
function verifyXenditWebhook(req, res, next) {
    const callbackToken = req.headers['x-callback-token'];
    const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;

    // In development without token configured, allow but warn
    if (!expectedToken) {
        console.warn('[SECURITY] XENDIT_CALLBACK_TOKEN not set in .env. Webhook NOT verified (dev mode).');
        return next();
    }

    if (callbackToken !== expectedToken) {
        console.error('[SECURITY] Invalid Xendit callback token! Rejecting webhook.');
        return res.status(401).json({ error: 'Invalid callback token' });
    }

    next();
}

module.exports = {
    issueToken,
    verifyLoginSignature,
    requireAuth,
    requireAdmin,
    requireOwnership,
    verifyXenditWebhook,
    JWT_SECRET
};
