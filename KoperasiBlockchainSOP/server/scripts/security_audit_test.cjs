/**
 * Automated Security Penetration & Integration Test Suite
 * KoperasiBlockchainSOP - Backend API Security Audit
 * 
 * Tests the security controls of the running Express server at http://localhost:5000.
 * Verifies that all endpoints correctly enforce JWT authentication, RBAC, and ownership.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 1. Derive JWT Secret and Addresses
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
if (!ADMIN_PRIVATE_KEY) {
    console.error("FATAL: ADMIN_PRIVATE_KEY tidak ditemukan di .env");
    process.exit(1);
}

// Derive Admin Address from Private Key
const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
const adminAddress = adminWallet.address.toLowerCase();

// Derive JWT_SECRET exactly as the backend does
const JWT_SECRET = crypto.createHash('sha256').update(`jwt_${ADMIN_PRIVATE_KEY}`).digest('hex');
const JWT_EXPIRY = '1h';

console.log("==================================================");
console.log("🛡️  KOPERASI BLOCKCHAIN - AUTOMATED SECURITY TEST");
console.log("==================================================");
console.log(`Admin Wallet Address : ${adminAddress}`);
console.log(`Target Server URL    : http://localhost:5000`);
console.log("==================================================\n");

// Generate tokens for testing
const adminToken = jwt.sign({ address: adminAddress }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
const memberA = "0x1111111111111111111111111111111111111111";
const memberB = "0x2222222222222222222222222222222222222222";
const memberAToken = jwt.sign({ address: memberA.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExIn0.fake_signature_here";

const BASE_URL = 'http://localhost:5000';

// Test statistics
let totalTests = 0;
let passedTests = 0;
const testResults = [];

async function runTest(category, name, path, options, expectedStatus, expectedErrorMessage = null) {
    totalTests++;
    const url = `${BASE_URL}${path}`;
    console.log(`[TEST ${totalTests}] Categori: ${category}`);
    console.log(`         Nama    : ${name}`);
    console.log(`         Endpoint: ${options.method || 'GET'} ${path}`);

    try {
        const res = await fetch(url, options);
        const status = res.status;
        let body = {};
        try {
            body = await res.json();
        } catch (e) {
            // Not JSON
        }

        const isStatusMatch = status === expectedStatus;
        let isErrorMsgMatch = true;

        if (expectedErrorMessage && body.error) {
            isErrorMsgMatch = body.error.toLowerCase().includes(expectedErrorMessage.toLowerCase());
        }

        const passed = isStatusMatch && isErrorMsgMatch;

        if (passed) {
            passedTests++;
            console.log(`\x1b[32m         Status  : PASSED (HTTP ${status})\x1b[0m`);
            testResults.push({ category, name, path, method: options.method || 'GET', passed: true, status });
        } else {
            console.log(`\x1b[31m         Status  : FAILED!\x1b[0m`);
            console.log(`         Diharapkan: HTTP ${expectedStatus}${expectedErrorMessage ? ` dengan error '${expectedErrorMessage}'` : ''}`);
            console.log(`         Diterima  : HTTP ${status} - Response:`, JSON.stringify(body));
            testResults.push({ category, name, path, method: options.method || 'GET', passed: false, status, response: body });
        }
    } catch (err) {
        console.log(`\x1b[31m         Status  : FAILED (Koneksi Error)\x1b[0m`, err.message);
        testResults.push({ category, name, path, method: options.method || 'GET', passed: false, error: err.message });
    }
    console.log("--------------------------------------------------");
}

async function startTests() {
    // ==================================================
    // CATEGORY A: AUTHENTICATION ENFORCEMENT (NO TOKEN / INVALID TOKEN)
    // ==================================================
    
    // A.1: Accessing admin balance without token
    await runTest(
        "AUTHENTICATION",
        "Block unauthenticated access to /api/balance",
        "/api/balance",
        { method: 'GET' },
        401,
        "tidak ditemukan"
    );

    // A.2: Accessing text decryption without token
    await runTest(
        "AUTHENTICATION",
        "Block unauthenticated access to /api/crypto/decrypt",
        "/api/crypto/decrypt",
        { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "iv:encrypted_text_here" })
        },
        401,
        "tidak ditemukan"
    );

    // A.3: Accessing payout without token
    await runTest(
        "AUTHENTICATION",
        "Block unauthenticated access to /api/withdraw",
        "/api/withdraw",
        { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: "100000", userAddress: adminAddress })
        },
        401,
        "tidak ditemukan"
    );

    // A.4: Accessing IPFS metadata with fake token
    await runTest(
        "AUTHENTICATION",
        "Block access with invalid/fake JWT token",
        `/api/ipfs/metadata/QmYZWRMw72BTeAzsg38iGvmYjc6Du58nyV5Yaam4ars7hT/${adminAddress}`,
        { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${fakeToken}` }
        },
        401,
        "tidak valid"
    );


    // ==================================================
    // CATEGORY B: ROLE-BASED ACCESS CONTROL / RBAC (ADMIN ONLY)
    // ==================================================

    // B.1: Accessing admin balance as a normal Member
    await runTest(
        "ROLE-BASED ACCESS CONTROL (RBAC)",
        "Block non-admin (member) from accessing /api/balance",
        "/api/balance",
        { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${memberAToken}` }
        },
        403,
        "bukan pengurus"
    );

    // B.2: Accessing admin balance as a valid Admin
    await runTest(
        "ROLE-BASED ACCESS CONTROL (RBAC)",
        "Allow authorized Admin to access /api/balance",
        "/api/balance",
        { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        },
        200
    );


    // ==================================================
    // CATEGORY C: OWNERSHIP PROTECTION & ID SPOOFING (REQUIRE OWNERSHIP)
    // ==================================================

    // C.1: Member A trying to create a payment for Member B (Spoofing)
    await runTest(
        "OWNERSHIP PROTECTION",
        "Block Member A from creating a payment for Member B (Spoofing)",
        "/api/payment/create",
        { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberAToken}` 
            },
            body: JSON.stringify({ 
                userAddress: memberB, // Trying to spoof Member B
                amount: 50000,
                isWajib: false
            })
        },
        403,
        "hanya bisa melakukan operasi untuk akun sendiri"
    );

    // C.2: Member A creating a payment for Member A (Legitimate)
    await runTest(
        "OWNERSHIP PROTECTION",
        "Allow Member A to create a payment for their own account",
        "/api/payment/create",
        { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${memberAToken}` 
            },
            body: JSON.stringify({ 
                userAddress: memberA, // Correct own address
                amount: 50000,
                isWajib: false
            })
        },
        200 // Should successfully create a Xendit invoice
    );

    // ==================================================
    // SUMMARY REPORT
    // ==================================================
    console.log("\n==================================================");
    console.log("📊  RINGKASAN HASIL UJI KEAMANAN (SECURITY AUDIT)");
    console.log("==================================================");
    console.log(`Total Uji Coba : ${totalTests}`);
    console.log(`Lulus          : ${passedTests} / ${totalTests} (${Math.round((passedTests/totalTests)*100)}%)`);
    console.log(`Gagal          : ${totalTests - passedTests}`);
    console.log("==================================================");
    
    if (passedTests === totalTests) {
        console.log("\x1b[32m🛡️  SISTEM AMAN: Semua kontrol keamanan berfungsi 100% sesuai spesifikasi!\x1b[0m");
    } else {
        console.log("\x1b[31m⚠️  WARNING: Ditemukan kegagalan pada kontrol keamanan backend!\x1b[0m");
    }
    console.log("==================================================\n");

    // Write a JSON result for programmatical verification
    const fs = require('fs');
    const auditReportPath = path.join(__dirname, '../data/security_audit_results.json');
    fs.writeFileSync(auditReportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        results: testResults
    }, null, 2));
}

startTests();
