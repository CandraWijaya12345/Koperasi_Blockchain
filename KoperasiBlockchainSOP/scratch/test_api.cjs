async function test() {
    console.log("Calling API to update settings...");
    try {
        const response = await fetch('http://localhost:5000/api/gov/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params: {
                    pokok: "150000",
                    bungaSimpanan: "9",
                    bungaPinjaman: "12",
                    dendaHarian: "1"
                }
            })
        });

        const data = await response.json();
        console.log("API Response:", data);
        if (data.success) {
            console.log("Success! Executed count:", data.executedCount);
        } else {
            console.error("Failed:", data.error);
        }
    } catch (e) {
        console.error("Request Error:", e);
    }
}

test();
