// Native fetch is available in Node 18+

async function main() {
    const params = {
        bungaSimpanan: 9,
        bungaPinjaman: 12,
        dendaHarian: 1,
        pokok: '250000', // Set to 250k
        adm: '0'
    };
    
    console.log("Sending update request...");
    const response = await fetch('http://localhost:5000/api/gov/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
    });
    
    const data = await response.json();
    console.log("Response:", data);
}

main();
