const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

async function findMissingPayments() {
    console.log("Checking Xendit for missing PAID invoices...");
    
    const auth = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64');
    
    try {
        // Fetch last 50 invoices from Xendit
        const res = await fetch('https://api.xendit.co/v2/invoices?limit=50', {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        const data = await res.json();
        
        if (!data || !Array.isArray(data)) {
             console.error("Failed to fetch invoices or invalid response:", data);
             return;
        }

        const paidInvoices = data.filter(i => i.status === 'PAID');
        console.log(`Found ${paidInvoices.length} PAID invoices in Xendit.`);

        // Load local log
        const logPath = path.join(__dirname, '../processed_payments.json');
        const localLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));

        const missing = [];
        for (const invoice of paidInvoices) {
            if (!localLog[invoice.external_id]) {
                missing.push(invoice);
            } else if (localLog[invoice.external_id].status !== 'COMPLETED') {
                missing.push(invoice);
            }
        }

        if (missing.length === 0) {
            console.log("No missing PAID transactions found.");
            return;
        }

        console.log(`\n!!! FOUND ${missing.length} MISSING/INCOMPLETE TRANSACTIONS !!!`);
        missing.forEach(m => {
            console.log(`- ID: ${m.external_id} | Amount: ${m.amount} | Desc: ${m.description} | Paid at: ${m.updated}`);
        });

    } catch (e) {
        console.error("Error during check:", e.message);
    }
}

findMissingPayments();
