const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const { Xendit } = require('xendit-node');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// [BARU] Pencatatan Pendaftaran Pending (Sebelum Bayar)
const PENDING_REG_FILE = path.join(__dirname, 'data', 'pending_registrations.json');

const ensureDataDir = () => {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    if (!fs.existsSync(PENDING_REG_FILE)) fs.writeFileSync(PENDING_REG_FILE, JSON.stringify({}));
};

const savePendingReg = (address, params) => {
    ensureDataDir();
    const data = JSON.parse(fs.readFileSync(PENDING_REG_FILE, 'utf8'));
    data[address.toLowerCase()] = params;
    fs.writeFileSync(PENDING_REG_FILE, JSON.stringify(data, null, 2));
};

const getPendingReg = (address) => {
    ensureDataDir();
    const data = JSON.parse(fs.readFileSync(PENDING_REG_FILE, 'utf8'));
    return data[address.toLowerCase()];
};

const removePendingReg = (address) => {
    ensureDataDir();
    const data = JSON.parse(fs.readFileSync(PENDING_REG_FILE, 'utf8'));
    delete data[address.toLowerCase()];
    fs.writeFileSync(PENDING_REG_FILE, JSON.stringify(data, null, 2));
};

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.error("FATAL: Missing PRIVATE_KEY or CONTRACT_ADDRESS in .env");
    process.exit(1);
}

// Load ABI
const ABI_PATH = path.join(__dirname, '../src/abi/koperasisimpanpinjambaru.json');
const CONTRACT_ABI = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));

// Data Storage
const LOANS_DB_PATH = path.join(__dirname, 'data/loans.json');
// Ensure directory exists
if (!fs.existsSync(path.dirname(LOANS_DB_PATH))) {
    fs.mkdirSync(path.dirname(LOANS_DB_PATH), { recursive: true });
}
if (!fs.existsSync(LOANS_DB_PATH)) {
    fs.writeFileSync(LOANS_DB_PATH, JSON.stringify({}));
}

// Helper to access loans DB
const getLoansDB = () => JSON.parse(fs.readFileSync(LOANS_DB_PATH, 'utf8'));
const saveLoansDB = (data) => fs.writeFileSync(LOANS_DB_PATH, JSON.stringify(data, null, 2));

// Initialize Blockchain Connection
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

console.log("\n[CONFIG] ---------------------------------------");
console.log("[CONFIG] Contract Address:", CONTRACT_ADDRESS);
console.log("[CONFIG] Admin Wallet:", wallet.address);
console.log("[CONFIG] ---------------------------------------\n");

// [FIX] Polygon Amoy Gas Overrides (Min 25 Gwei Priority Fee needed)
const GAS_OVERRIDE = {
    maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
    maxFeePerGas: ethers.parseUnits('50', 'gwei')
};

// --- UTILITIES ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Check if Admin Wallet has enough POL for Gas
async function checkGasFunds(customAmountWei = 0n) {
    try {
        const balance = await provider.getBalance(wallet.address);
        const threshold = ethers.parseEther("0.05"); // Warn if below 0.05 POL
        
        if (balance < threshold) {
            console.warn(`[WARNING] Low Admin Balance: ${ethers.formatEther(balance)} POL. Please top up soon.`);
        }
        
        if (customAmountWei > 0n && balance < customAmountWei) {
            throw new Error(`INSUFFICIENT_FUNDS: Saldo POL Admin (${ethers.formatEther(balance)}) tidak cukup untuk transaksi.`);
        }
        return balance;
    } catch (e) {
        console.error("Gas check error:", e.message);
        throw e;
    }
}

// --- PERSISTENCE: Payment Progress Tracker ---
const PAYMENTS_FILE = path.join(__dirname, 'processed_payments.json');

function getPaymentLog() {
    if (!fs.existsSync(PAYMENTS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
    } catch (e) { return {}; }
}

function savePaymentLog(log) {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(log, null, 2));
}

function updatePaymentStatus(externalId, status, data = {}) {
    const log = getPaymentLog();
    log[externalId] = {
        ...log[externalId],
        ...data,
        status,
        lastUpdate: new Date().toISOString()
    };
    savePaymentLog(log);
}

// Auto-Recovery on Startup
async function recoverIncompletePayments() {
    console.log("[Recovery] Checking for incomplete payments...");
    const log = getPaymentLog();
    const incomplete = Object.keys(log).filter(id => log[id].status !== 'COMPLETED');
    
    if (incomplete.length === 0) {
        console.log("[Recovery] No incomplete payments found.");
        return;
    }

    console.log(`[Recovery] Found ${incomplete.length} incomplete payments. Resuming...`);
    for (const id of incomplete) {
        const payData = log[id];
        console.log(`[Recovery] Resuming payment: ${id} (${payData.status})`);
        // We simulate a minimal Xendit data object for processPaymentLogics
        const xenditData = {
            external_id: id,
            status: 'PAID', // Re-triggering as PAID
            amount: payData.amount,
            description: payData.description
        };
        // Run without awaiting to not block startup, but we'll do them sequentially for safety
        try {
            await processPaymentLogics(xenditData);
        } catch (err) {
            console.error(`[Recovery] Failed to recover ${id}:`, err.message);
        }
    }
}

// --- XENDIT CONFIG ---
const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY,
});

const { Invoice, Payout, Balance } = xenditClient;

// --- ROUTES ---

// 1. Payment: Create Invoice (Simpanan)
app.post('/api/payment/create', async (req, res) => {
    const { userAddress, amount, isWajib } = req.body;
    if (!userAddress || !amount) return res.status(400).json({ error: "Data tidak lengkap" });

    const externalId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
        const typeLabel = isWajib === 'POKOK' ? 'Pokok' : (isWajib ? 'Wajib' : 'Sukarela');

        const response = await Invoice.createInvoice({
            data: {
                externalId: externalId,
                amount: Number(amount),
                payerEmail: 'anggota@koperasi.com',
                description: `Simpanan Koperasi (${typeLabel}) - ${userAddress}`,
                invoiceDuration: 86400, // 24 hours
                currency: 'IDR',
                items: [
                    {
                        name: `Simpanan ${typeLabel}`,
                        quantity: 1,
                        price: Number(amount)
                    }
                ],
                successRedirectUrl: 'http://localhost:5173?payment=success',
                failureRedirectUrl: 'http://localhost:5173?payment=failure',
                // Store metadata to direct traffic in webhook
                tags: [userAddress, isWajib ? 'WAJIB' : 'SUKARELA']
            }
        });

        // Response contains invoiceUrl which frontend should redirect to
        res.json({
            success: true,
            invoiceUrl: response.invoiceUrl,
            externalId: externalId
        });
    } catch (e) {
        console.error("Xendit Invoice Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 1b. Payment: Create Invoice (Loan Repayment / Angsuran)
app.post('/api/payment/repay', async (req, res) => {
    const { userAddress, loanId, amount } = req.body;
    if (!userAddress || !loanId || !amount) {
        return res.status(400).json({ error: "Data tidak lengkap (userAddress, loanId, amount)" });
    }

    const externalId = `REPAY-${loanId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
        const response = await Invoice.createInvoice({
            data: {
                externalId: externalId,
                amount: Number(amount),
                payerEmail: 'anggota@koperasi.com',
                description: `Angsuran Pinjaman #${loanId} - ${userAddress}`,
                invoiceDuration: 86400,
                currency: 'IDR',
                items: [
                    {
                        name: `Angsuran Pinjaman #${loanId}`,
                        quantity: 1,
                        price: Number(amount)
                    }
                ],
                successRedirectUrl: 'http://localhost:5173?payment=success',
                failureRedirectUrl: 'http://localhost:5173?payment=failure',
                tags: [userAddress, `LOAN-${loanId}`]
            }
        });

        console.log(`Repayment Invoice Created: ${externalId} for Loan #${loanId}, Amount: ${amount}`);
        res.json({
            success: true,
            invoiceUrl: response.invoiceUrl,
            externalId: externalId
        });
    } catch (e) {
        console.error("Xendit Repayment Invoice Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Webhook: Xendit Callback (Invoice Paid)
app.post('/api/xendit-callback', async (req, res) => {
    const data = req.body;
    console.log("Xendit Webhook Received:", data.status, data.external_id);
    await processPaymentLogics(data);
    res.status(200).json({ status: 'OK' });
});

// 2c. Manual Verification Endpoint (Backup if Webhook fails)
app.get('/api/payment/verify/:externalId', async (req, res) => {
    const { externalId } = req.params;
    try {
        console.log(`Manual verification requested for: ${externalId}`);
        const response = await Invoice.getInvoice({ invoiceId: externalId });
        // NOTE: xendit-node might use invoiceId or you might need a different list call for external_id
        // Using getInvoice based on ID if available, otherwise just check status logic
        
        if (response.status === 'PAID' || response.status === 'SETTLED') {
            await processPaymentLogics(response);
            return res.json({ success: true, status: response.status });
        }
        res.json({ success: false, status: response.status });
    } catch (e) {
        console.error("Verification Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Helper function to process payments (Webhook or Manual)
async function processPaymentLogics(data) {
    const externalId = data.external_id || data.id;
    if (data.status === 'PAID' || data.status === 'SETTLED') {
        try {
            // Check if already completed to prevent double processing
            const log = getPaymentLog();
            if (log[externalId] && log[externalId].status === 'COMPLETED') {
                console.log(`[Webhook] Payment ${externalId} already COMPLETED. Skipping.`);
                return;
            }

            // PRE-CHECK: Gas Funds
            await checkGasFunds(); 

            const description = data.description || "";
            const parts = description.split(' - ');
            let userAddress = null;

            if (parts.length > 1) {
                userAddress = parts[1].trim();
            }

            const amount = data.amount;
            const amountWei = ethers.parseUnits(amount.toString(), 18);

            // Log initial receipt
            updatePaymentStatus(externalId, 'PROCESSING', { userAddress, amount, description });

            if (description.startsWith('Angsuran Pinjaman')) {
                const loanIdMatch = description.match(/#(\d+)/);
                const loanId = loanIdMatch ? loanIdMatch[1] : null;

                if (loanId && userAddress && userAddress.startsWith('0x')) {
                    console.log(`[Webhook] Processing Repayment for Loan #${loanId} (User: ${userAddress})`);
                    const tx = await contract.recordAngsuran(loanId, amountWei, GAS_OVERRIDE);
                    await tx.wait();
                    updatePaymentStatus(externalId, 'COMPLETED');
                    console.log(`[Webhook] Repayment SUCCESS for ${externalId}`);
                }
            } else {
                const lowerDesc = description.toLowerCase();
                const isWajib = lowerDesc.includes('wajib'); // [FIX] Pokok is NOT wajib overflow, it's Sukarela overflow
                const isPokok = lowerDesc.includes('pokok');

                if (userAddress && userAddress.startsWith('0x')) {
                    if (isPokok) {
                        // Check if registration already done in a previous (interrupted) run
                        const currentStatus = (log[externalId] || {}).status;
                        
                        if (currentStatus !== 'REG_DONE' && currentStatus !== 'POLLING_ACTIVE') {
                            const pendingParams = getPendingReg(userAddress);
                            if (pendingParams) {
                                console.log(`[Webhook] Found pending registration for ${userAddress}. Executing blockchain registry...`);
                                const mappedParamsArr = [
                                    pendingParams.user,
                                    pendingParams.nama || "Tanpa Nama",
                                    pendingParams.noHP || "-",
                                    pendingParams.noKTP || "-",
                                    pendingParams.alamat || "-",
                                    pendingParams.gender || pendingParams.jenisKelamin || "-",
                                    pendingParams.job || pendingParams.pekerjaan || "-",
                                    pendingParams.emergency || pendingParams.kontakDarurat || "-",
                                    BigInt(pendingParams.branchId || pendingParams.branchID || 1)
                                ];

                                try {
                                    const regTx = await contract.registerMember(mappedParamsArr, GAS_OVERRIDE);
                                    await regTx.wait();
                                    console.log(`[Webhook] Blockchain Registration SUCCESS for ${userAddress}`);
                                    removePendingReg(userAddress);
                                    updatePaymentStatus(externalId, 'REG_DONE');
                                } catch (regErr) {
                                    if (regErr.message.includes("sudah terdaftar")) {
                                        console.log(`[Webhook] User ${userAddress} already registered on-chain.`);
                                        updatePaymentStatus(externalId, 'REG_DONE');
                                    } else {
                                        console.error(`[Webhook] Registration FAILED:`, regErr.message);
                                        // We don't mark as COMPLETED, so it stays in PROCESSING/RECOVERY
                                    }
                                }
                            } else {
                                console.log(`[Webhook] No pending registry for ${userAddress}, assuming already handled.`);
                                updatePaymentStatus(externalId, 'REG_DONE');
                            }
                        }

                        // Polling for Activation
                        console.log(`[Webhook] Waiting for ${userAddress} to become ACTIVE on blockchain...`);
                        updatePaymentStatus(externalId, 'POLLING_ACTIVE');
                        
                        let isRegistered = false;
                        let pollAttempts = 0;
                        const maxPolls = 25; // Increased polls for UAT Safety (125s window)

                        while (!isRegistered && pollAttempts < maxPolls) {
                            pollAttempts++;
                            try {
                                const member = await contract.dataAnggota(userAddress);
                                if (member.terdaftar) {
                                    console.log(`[Webhook] User ${userAddress} is now ACTIVE (Poll ${pollAttempts}).`);
                                    isRegistered = true;
                                } else {
                                    await sleep(5000);
                                }
                            } catch (pollErr) {
                                await sleep(5000);
                            }
                        }
                    }

                    // Record the Deposit (Final Step)
                    let depositSuccess = false;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (!depositSuccess && attempts < maxAttempts) {
                        try {
                            attempts++;
                            console.log(`[Webhook] Recording deposit for ${userAddress} (Attempt ${attempts}/${maxAttempts})...`);
                            const tx = await contract.recordDeposit(userAddress, amountWei, isWajib, GAS_OVERRIDE);
                            await tx.wait();
                            console.log(`[Webhook] Deposit SUCCESS for ${userAddress}`);
                            depositSuccess = true;
                            updatePaymentStatus(externalId, 'COMPLETED');
                        } catch (depErr) {
                            console.error(`[Webhook] Deposit Attempt ${attempts} FAILED:`, depErr.message);
                            if (attempts < maxAttempts) {
                                await sleep(5000);
                            } else {
                                updatePaymentStatus(externalId, 'FAILED_DEPOSIT', { error: depErr.message });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Payment Processing Error:", err.message);
            updatePaymentStatus(externalId, 'ERROR', { error: err.message });
        }
    }
}

// 2b. Webhook: Xendit Disbursement Callback (Payout Status)
// NOTE: Set this URL in Xendit Dashboard > Settings > Callbacks > Money Out
app.post('/api/xendit-disbursement-callback', async (req, res) => {
    const callbackToken = req.headers['x-callback-token'];
    // In production, verify callbackToken

    const data = req.body;
    console.log("Xendit Disbursement Webhook:", data.status, data.external_id);

    // data.status can be 'COMPLETED' or 'FAILED'
    if (data.status === 'COMPLETED') {
        console.log(`[Webhook] Payout SUCCESS: ${data.external_id}, Amount: ${data.amount}`);
        // Optionally update DB or notify user
    } else if (data.status === 'FAILED') {
        console.error(`[Webhook] Payout FAILED: ${data.external_id} - ${data.failure_code}`);
        // CRITICAL: In real app, we should revert blockchain state or flag for admin review
        // For now, just log it.
    }

    res.status(200).json({ status: 'OK' });
});

// Helper for Manual Deposit (if needed for testing)
app.post('/api/webhook/deposit', async (req, res) => {
    // Same as before
    const { userAddress, amount, isWajib } = req.body;
    if (!userAddress || !amount) return res.status(400).json({ error: "Data missing" });
    try {
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await contract.recordDeposit(userAddress, amountWei, isWajib || false, GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper for Repayment (Manual/Webhook)
app.post('/api/webhook/repay', async (req, res) => {
    const { loanId, amount } = req.body;
    if (!loanId || !amount) return res.status(400).json({ error: "Data missing" });
    try {
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await contract.recordAngsuran(loanId, amountWei, GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// NEW: Approve Loan & Disburse Logic
app.post('/api/loan/approve-disburse', async (req, res) => {
    const { loanId, userAddress } = req.body;
    if (!loanId || !userAddress) return res.status(400).json({ error: "Missing loanId or userAddress" });

    try {
        console.log(`Approving Loan #${loanId} for ${userAddress}...`);

        // PRE-CHECK: Check POL Balance for Gas
        const gasBal = await provider.getBalance(wallet.address);
        if (gasBal < ethers.parseEther("0.005")) { // Minimum 0.005 POL for a safe tx
             return res.status(400).json({ 
                error: `GAS_ERROR: Saldo POL Admin Kurang! Saldo: ${ethers.formatEther(gasBal)} POL. Butuh minimal 0.005 POL agar aman.` 
            });
        }

        // 1. Get Bank Details from Local DB
        const db = getLoansDB();
        const details = db[userAddress.toLowerCase()];

        if (!details) {
            return res.status(400).json({ error: "Bank Details not found for this user. Cannot disburse." });
        }

        // 2. Approve on Blockchain (Execute setujuiPinjaman via Admin Wallet)
        // Check if already approved? Contract will revert if so.
        // We assume frontend calls this INSTEAD of calling contract directly.

        // Note: contract.setujuiPinjaman(id) requires Admin
        // Wait! server wallet IS Admin.

        const tx = await contract.setujuiPinjaman(loanId, GAS_OVERRIDE);
        console.log("Blockchain Approval Tx:", tx.hash);
        await tx.wait();
        console.log("Blockchain Approval Confirmed.");

        // 3. Trigger Xendit Payout
        const channelCode = `ID_${details.bank.toUpperCase()}`;
        console.log(`[Xendit Payout] Triggering: ${channelCode} to ${details.accountNumber} (Amount: ${details.loanAmount})`);

        const externalId = `DISB-${loanId}-${Date.now()}`;
        const payoutResult = await Payout.createPayout({
            idempotencyKey: `ikey-${externalId}`,
            data: {
                referenceId: externalId,
                channelCode: channelCode,
                channelProperties: {
                    accountHolderName: details.accountHolderName || 'Anggota Koperasi', 
                    accountNumber: details.accountNumber,
                },
                amount: Number(details.loanAmount),
                currency: 'IDR',
                description: `Pencairan Pinjaman #${loanId}`,
                type: 'DIRECT_DISBURSEMENT'
            }
        });

        console.log("Xendit Payout Created:", payoutResult.status);

        res.json({
            success: true,
            txHash: tx.hash,
            payoutId: payoutResult.id,
            status: payoutResult.status
        });

    } catch (e) {
        console.error("Approve & Disburse Error:", e);
        // If blockchain succeeded but payout failed, we are in a partial state.
        // Ideally we shouldn't fail Payout if blockchain worked.
        // But for now, returning error is safer so user knows.
        res.status(500).json({ error: e.message });
    }
});

// Admin: Close Membership
app.post('/api/admin/close-membership', async (req, res) => {
    const { memberAddress } = req.body;
    try {
        console.log(`[Admin] Closing Membership for: ${memberAddress}`);
        const tx = await contract.tutupKeanggotaan(memberAddress, { 
            maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), 
            maxFeePerGas: ethers.parseUnits('45', 'gwei') 
        });
        console.log(`[Admin] Tx Sent: ${tx.hash}`);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        console.error("[Admin] Close Membership Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 3. User Registration
app.post('/api/register', async (req, res) => {
    const { params } = req.body;
    try {
        console.log(`\n[Registration] --- QUEUING PROCESS for: ${params.user} ---`);
        
        if (!params.user) throw new Error("Alamat user (address) tidak ditemukan dalam payload");

        // [BARU] Jangan panggil blockchain di sini!
        // Simpan saja di antrean pending. Pendaftaran blockchain dilakuan setelal bayar Simpanan Pokok via Webhook.
        savePendingReg(params.user, params);
        
        console.log(`[Registration] User ${params.user} queued. Waiting for payment...`);
        
        res.json({ 
            success: true, 
            message: "Data pendaftaran tersimpan. Silahkan selesaikan pembayaran untuk aktivasi akun.",
            isQueued: true 
        });
    } catch (error) {
        console.error("[Registration] ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 3.1 Update Global Settings (Admin)
// Supports partial update by merging current settings
app.post('/api/gov/update-settings', async (req, res) => {
    try {
        // --- DIAGNOSTIC LOGGING ---
        console.log("--------------------------------------------------");
        console.log("[Admin] DIAGNOSTIC: Incoming Payload:", JSON.stringify(req.body));
        const { params: newSettings } = req.body;
        
        if (!newSettings) {
            console.error("[Admin] ERROR: req.body.params is UNDEFINED. Check frontend payload construction.");
            return res.status(400).json({ error: "Payload params missing" });
        }

        // 1. Fetch current settings (Source of Truth)
        console.log("[Admin] Fetching current settings (Source of Truth)...");
        const current = await contract.settings();
        
        // 2. Build explicit array-based struct for updateGlobalSettings (order must match Solidity)
        // 0:autoColl, 1:multiBranch, 2:deductUpfront, 3:closePeriod, 
        // 4:pokok (Wei), 5:adm (Wei), 6:minSaldo (Wei), 7:feeAdmin (Wei), 
        // 8:feeProvisi (%), 9:feeResiko (%)
        const pArray = [
            newSettings.autoColl !== undefined ? !!newSettings.autoColl : (current[0] ?? current.autoCollectibility),
            newSettings.multiBranch !== undefined ? !!newSettings.multiBranch : (current[1] ?? current.multiBranchEnabled),
            newSettings.deductUpfront !== undefined ? !!newSettings.deductUpfront : (current[2] ?? current.deductFeesUpfront),
            newSettings.closePeriod !== undefined ? !!newSettings.closePeriod : (current[3] ?? current.isPeriodClosed),
            (newSettings.pokok !== undefined && newSettings.pokok !== "") ? ethers.parseUnits(newSettings.pokok.toString(), 18) : (current[4] ?? current.nominalSimpananPokok),
            (newSettings.adm !== undefined && newSettings.adm !== "") ? ethers.parseUnits(newSettings.adm.toString(), 18) : (current[5] ?? current.nominalAdmPendaftaran),
            (newSettings.minSaldo !== undefined && newSettings.minSaldo !== "") ? ethers.parseUnits(newSettings.minSaldo.toString(), 18) : (current[6] ?? current.minSaldo),
            (newSettings.feeAdmin !== undefined && newSettings.feeAdmin !== "") ? ethers.parseUnits(newSettings.feeAdmin.toString(), 18) : (current[7] ?? current.feeAdministrasi),
            newSettings.feeProvisi !== undefined ? BigInt(newSettings.feeProvisi) : (current[8] ?? current.feeProvisiPersen),
            newSettings.feeResiko !== undefined ? BigInt(newSettings.feeResiko) : (current[9] ?? current.feeResikoPersen)
        ];

        console.log("[Admin] CALCULATED ARRAY FOR BLOCKCHAIN:", pArray.map(p => p.toString()));

        const tasks = [];
        tasks.push({ 
            name: "Global Settings (Pokok/Adm)", 
            fn: () => contract.updateGlobalSettings(pArray, GAS_OVERRIDE) 
        });

        // --- TASK B: setBungaSimpanan ---
        if (newSettings.bungaSimpanan !== undefined) {
            const val = parseInt(newSettings.bungaSimpanan);
            if (val <= 9) tasks.push({ name: "Bunga Simpanan", fn: () => contract.setBungaSimpanan(val, GAS_OVERRIDE) });
        }

        // --- TASK C: setBungaPinjaman ---
        if (newSettings.bungaPinjaman !== undefined) {
            const val = parseInt(newSettings.bungaPinjaman);
            if (val <= 24) tasks.push({ name: "Bunga Pinjaman", fn: () => contract.setBungaPinjaman(val, GAS_OVERRIDE) });
        }

        // --- TASK D: setDendaHarian ---
        if (newSettings.dendaHarian !== undefined) {
            const val = parseInt(newSettings.dendaHarian);
            if (val <= 10) tasks.push({ name: "Denda Harian", fn: () => contract.setDendaHarian(val, GAS_OVERRIDE) });
        }

        console.log(`[Admin] Starting sequential execution of ${tasks.length} tasks...`);
        let count = 0;
        for (const task of tasks) {
            try {
                console.log(`[Admin] [${count + 1}/${tasks.length}] Executing: ${task.name}...`);
                const tx = await task.fn();
                console.log(`[Admin] Transaction sent: ${tx.hash}. Waiting for confirmation...`);
                await tx.wait();
                console.log(`[Admin] Confirmed: ${task.name}`);
                count++;
            } catch (taskErr) {
                console.error(`[Admin] Error in ${task.name}:`, taskErr.message);
                // Continue to next task even if one fails (unless it's a fatal provider error)
            }
        }

        res.json({ success: true, executedCount: count });
    } catch (e) {
        console.error("Critical Settings Update Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Admin: Approve Survey
app.post('/api/loan/survey', async (req, res) => {
    const { loanId, note } = req.body;
    try {
        const tx = await contract.approveSurvey(loanId, note || "", GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Approve Committee
app.post('/api/loan/committee', async (req, res) => {
    const { loanId } = req.body;
    try {
        const tx = await contract.approveCommittee(loanId, GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Reject Loan
app.post('/api/loan/reject', async (req, res) => {
    const { loanId, reason } = req.body;
    try {
        const tx = await contract.tolakPinjaman(loanId, reason || "Ditolak oleh Admin", GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Generate Monthly Bills
app.post('/api/gov/generate-bills', async (req, res) => {
    const { amount } = req.body;
    try {
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await contract.generateMonthlyBills(amountWei, GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Release Profit Sharing (SHU)
app.post('/api/gov/release-sharing', async (req, res) => {
    const { percentage } = req.body;
    try {
        const tx = await contract.rilisBagiHasil(percentage, GAS_OVERRIDE);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// NEW: Store Loan Request Details (Bank Info)
app.post('/api/loan/save-details', async (req, res) => {
    const { userAddress, bank, accountNumber, loanAmount } = req.body;
    if (!userAddress || !bank || !accountNumber) {
        return res.status(400).json({ error: "Missing bank details" });
    }

    try {
        const db = getLoansDB();
        // Key by userAddress since contract only allows 1 active loan per user anyway
        db[userAddress.toLowerCase()] = {
            bank,
            accountNumber,
            loanAmount,
            timestamp: Date.now()
        };
        saveLoansDB(db);
        console.log(`Saved loan details for ${userAddress}: ${bank} - ${accountNumber}`);
        res.json({ success: true });
    } catch (e) {
        console.error("Save Loan Details Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// NEW: Get Loan Details
app.get('/api/loan/details/:userAddress', (req, res) => {
    const { userAddress } = req.params;
    const db = getLoansDB();
    const details = db[userAddress.toLowerCase()];
    res.json({ success: true, details });
});

// 4. Withdrawal (Xendit Payout)
app.post('/api/withdraw', async (req, res) => {
    const { userAddress, amount, bank, accountNumber } = req.body;
    if (!userAddress || !amount || !bank || !accountNumber) {
        return res.status(400).json({ error: "Missing withdrawal data" });
    }

    try {
        console.log(`Processing Withdrawal: ${amount} to ${bank} ${accountNumber}`);

        // 1. Create Payout in Xendit
        const externalId = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        let payoutResult;

        try {
            const channelCode = `ID_${bank.toUpperCase()}`;
            console.log(`[Xendit Withdrawal] Requesting Payout: ${channelCode} to ${accountNumber} (Amount: ${amount})`);

            // Use Payout V2 or Disbursements (Payout is easier)
            // [FIX] Use Payout V2 Schema (channelCode + channelProperties)
            payoutResult = await Payout.createPayout({
                idempotencyKey: `ikey-${externalId}`,
                data: {
                    referenceId: externalId,
                    channelCode: channelCode,
                    channelProperties: {
                        accountHolderName: 'Anggota Koperasi',
                        accountNumber: accountNumber,
                    },
                    amount: Number(amount),
                    currency: 'IDR',
                    description: `Penarikan Simpanan - ${userAddress}`,
                    type: 'DIRECT_DISBURSEMENT'
                }
            });

            console.log("Xendit Payout Created:", payoutResult.status);
        } catch (xenditErr) {
            console.error("Xendit Payout Failed:", xenditErr.message);
            // Return error to user so they know payout failed
            // In demo, we might want to continue to burn token?
            // But for Xendit migration, let's be strict.
            return res.status(400).json({ error: "Gagal memproses Payout Xendit: " + xenditErr.message });
        }

        // 2. Burn Tokens on Blockchain
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await contract.recordWithdrawal(userAddress, amountWei, GAS_OVERRIDE);
        console.log("Burn Tx Sent:", tx.hash);
        await tx.wait();

        res.json({
            success: true,
            txHash: tx.hash,
            payoutId: payoutResult.id,
            status: payoutResult.status
        });

    } catch (error) {
        console.error("Blockchain Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Get Balances (Xendit + Contract)
app.get('/api/balance', async (req, res) => {
    try {
        // Parallel fetch for speed
        const xRes = await Balance.getBalance({ accountType: 'CASH' });
        const tokenAddr = await contract.idrToken();
        const token = new ethers.Contract(tokenAddr, ['function balanceOf(address) view returns (uint256)'], wallet);
        
        const [cBal, polBal] = await Promise.all([
            token.balanceOf(CONTRACT_ADDRESS),
            provider.getBalance(wallet.address)
        ]);

        res.json({
            success: true,
            balance: xRes.balance, 
            xenditBalance: xRes.balance,
            contractBalance: cBal.toString(),
            adminPolBalance: ethers.formatEther(polBal)
        });
    } catch (error) {
        console.error("Balance Fetch Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUTOMATED SYNC SERVICE ---
let isAutoSyncing = false;
async function runAutoSync() {
    if (isAutoSyncing) return;
    isAutoSyncing = true;
    try {
        console.log("[AutoSync] Checking Liquidity...");

        // 1. Get Xendit Balance and convert to WEI (18 decimals)
        const xRes = await Balance.getBalance({ accountType: 'CASH' });
        const xBalanceFiat = Math.floor(xRes.balance); 
        const xBalanceWei = ethers.parseUnits(xBalanceFiat.toString(), 18);

        // 2. Get Contract Balance (This is already in WEI)
        // We check balance of the KOPERASI CONTRACT ADDRESS itself (The Reserve)
        const cBalance = await contract.idrToken().then(tokenAddr => {
            const token = new ethers.Contract(tokenAddr, ['function balanceOf(address) view returns (uint256)'], wallet);
            return token.balanceOf(CONTRACT_ADDRESS);
        });

        const diff = xBalanceWei - cBalance;

        if (diff > 0n) {
            console.log(`[AutoSync] Diff detected: ${diff.toString()}. Injecting Liquidity...`);

            // 3. Register Koperasi as Member if needed (One time)
            const isMember = await contract.dataAnggota(CONTRACT_ADDRESS).then(d => d.terdaftar);
            if (!isMember) {
                try {
                    console.log("[AutoSync] Registering Koperasi Reserve Account...");
                    // Use a tuple-like object and ensure branchId is BigInt
                    const txReg = await contract.registerMember({
                        user: CONTRACT_ADDRESS,
                        nama: "KOPERASI RESERVE",
                        noHP: "SYSTEM",
                        noKTP: "SYSTEM",
                        alamat: "SYSTEM",
                        gender: "SYSTEM",
                        job: "SYSTEM",
                        emergency: "SYSTEM",
                        branchId: 0n // Use BigInt explicitly
                    }, GAS_OVERRIDE);
                    await txReg.wait();
                    console.log("[AutoSync] Reserve Account Registered Successfully.");
                } catch (regErr) {
                    // It might already be registered but dataAnggota lookup failed or had lag
                    console.warn("[AutoSync] Registration warning:", regErr.message);
                }
            }

            // 4. Mint Difference via recordDeposit
            // This mints tokens to CONTRACT_ADDRESS
            const tx = await contract.recordDeposit(CONTRACT_ADDRESS, diff, false, GAS_OVERRIDE);
            await tx.wait();
            console.log(`[AutoSync] Success! Minted ${diff.toString()} to Reserve.`);
        } else {
            console.log("[AutoSync] Liquidity is sufficient.");
        }

    } catch (err) {
        // Silently skip if transaction is already in mempool (already known)
        if (err.message && !err.message.includes('already known')) {
            console.error("[AutoSync] Error:", err.message);
        }
    } finally {
        isAutoSyncing = false;
    }
}

// Check every 60 seconds
setInterval(runAutoSync, 60000);

// Manual Trigger Endpoint
app.post('/api/sync-liquidity', async (req, res) => {
    try {
        await runAutoSync();
        res.json({ success: true, message: "Sync process triggered" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Debug Endpoint
app.get('/api/debug/liquidity', async (req, res) => {
    try {
        const tokenAddr = await contract.idrToken();
        const token = new ethers.Contract(tokenAddr, ['function balanceOf(address) view returns (uint256)'], wallet);
        const bal = await token.balanceOf(CONTRACT_ADDRESS);
        const member = await contract.dataAnggota(CONTRACT_ADDRESS);

        res.json({
            contractAddress: CONTRACT_ADDRESS,
            tokenAddress: tokenAddr,
            balanceIDRT: bal.toString(),
            isMember: member.terdaftar,
            simpananWajib: member.simpananWajib.toString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Health Check
app.get('/', (req, res) => {
    res.send('Koperasi Server (Xendit Integrated) is Running!');
});

app.listen(PORT, async () => {
    console.log("\n------------------------------------------------");
    console.log(` SERVER RUNNING: http://localhost:${PORT}`);
    console.log(` CONTRACT: ${CONTRACT_ADDRESS}`);
    console.log(" STATUS: AUTOMATED SYNC V2 ENABLED");
    console.log("------------------------------------------------\n");

    // Start Recovery Process
    await recoverIncompletePayments();
});
