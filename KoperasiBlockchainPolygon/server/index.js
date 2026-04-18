require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { Xendit } = require('xendit-node');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

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

console.log("Connected to Polygon RPC:", RPC_URL);
console.log("Contract Address:", CONTRACT_ADDRESS);
console.log("Admin Wallet:", wallet.address);

// --- UTILITIES ---

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
        const response = await Invoice.createInvoice({
            data: {
                externalId: externalId,
                amount: Number(amount),
                payerEmail: 'anggota@koperasi.com',
                description: `Simpanan Koperasi (${isWajib ? 'Wajib' : 'Sukarela'}) - ${userAddress}`,
                invoiceDuration: 86400, // 24 hours
                currency: 'IDR',
                items: [
                    {
                        name: `Simpanan ${isWajib ? 'Wajib/Pokok' : 'Sukarela'}`,
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
    if (data.status === 'PAID' || data.status === 'SETTLED') {
        try {
            // PRE-CHECK: Gas Funds
            await checkGasFunds(); // Throws if too low for safe monitoring

            const description = data.description || "";
            const parts = description.split(' - ');
            let userAddress = null;

            if (parts.length > 1) {
                userAddress = parts[1].trim();
            }

            const amount = data.amount;
            const amountWei = ethers.parseUnits(amount.toString(), 18);

            if (description.startsWith('Angsuran Pinjaman')) {
                const loanIdMatch = description.match(/#(\d+)/);
                const loanId = loanIdMatch ? loanIdMatch[1] : null;

                if (loanId && userAddress && userAddress.startsWith('0x')) {
                    const tx = await contract.recordAngsuran(loanId, amountWei);
                    await tx.wait();
                }
            } else {
                const isWajib = description.includes('Wajib') || description.includes('Pokok');
                if (userAddress && userAddress.startsWith('0x')) {
                    const tx = await contract.recordDeposit(userAddress, amountWei, isWajib);
                    await tx.wait();
                }
            }
        } catch (err) {
            console.error("Payment Processing Error:", err.message);
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
        const tx = await contract.recordDeposit(userAddress, amountWei, isWajib || false);
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
        const tx = await contract.recordAngsuran(loanId, amountWei);
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

        const tx = await contract.setujuiPinjaman(loanId);
        console.log("Blockchain Approval Tx:", tx.hash);
        await tx.wait();
        console.log("Blockchain Approval Confirmed.");

        // 3. Trigger Xendit Payout
        console.log(`Disbursing Rp ${details.loanAmount} to ${details.bank} ${details.accountNumber}...`);

        const externalId = `DISB-${loanId}-${Date.now()}`;
        const payoutResult = await Payout.createPayout({
            idempotencyKey: `ikey-${externalId}`,
            data: {
                referenceId: externalId,
                channelCode: `ID_${details.bank.toUpperCase()}`,
                channelProperties: {
                    accountHolderName: 'Anggota Koperasi', // Ideally getting name from DB too
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

// 3. User Registration
app.post('/api/register', async (req, res) => {
    // Same logic
    const { userAddress, name, ktpLink } = req.body;
    try {
        const tx = await contract.registerMember(userAddress, name, ktpLink);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            console.log("Requesting Xendit Payout...");

            // Use Payout V2 or Disbursements (Payout is easier)
            // [FIX] Use Payout V2 Schema (channelCode + channelProperties)
            payoutResult = await Payout.createPayout({
                idempotencyKey: `ikey-${externalId}`,
                data: {
                    referenceId: externalId,
                    channelCode: `ID_${bank.toUpperCase()}`, // e.g., ID_BCA
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
        const tx = await contract.recordWithdrawal(userAddress, amountWei);
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
async function runAutoSync() {
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
                console.log("[AutoSync] Registering Koperasi Reserve Account...");
                const txReg = await contract.registerMember(CONTRACT_ADDRESS, "KOPERASI RESERVE", "SYSTEM");
                await txReg.wait();
            }

            // 4. Mint Difference via recordDeposit
            // This mints tokens to CONTRACT_ADDRESS
            const tx = await contract.recordDeposit(CONTRACT_ADDRESS, diff, false);
            await tx.wait();
            console.log(`[AutoSync] Success! Minted ${diff.toString()} to Reserve.`);
        } else {
            console.log("[AutoSync] Liquidity is sufficient.");
        }

    } catch (err) {
        console.error("[AutoSync] Error:", err.message);
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("!!! SERVER CODE UPDATED V2 - AUTOMATED SYNC ENABLED !!!");
});
