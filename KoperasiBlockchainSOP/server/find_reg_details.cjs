const fs = require('fs');
const readline = require('readline');

async function main() {
    const file = "C:\\Users\\Candra Wijaya\\.gemini\\antigravity-ide\\brain\\1e646a3a-efd3-424b-9446-1b54288c14c5\\.system_generated\\logs\\transcript.jsonl";
    const fileStream = fs.createReadStream(file);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("Searching logs for registration data...");
    for await (const line of rl) {
        if (line.includes('noHP') && line.includes('noKTP') && line.includes('photoBase64')) {
            // Find if it looks like a registration payload from user/frontend
            console.log("\nFOUND USER REGISTRATION PAYLOAD:");
            // Print the match
            console.log(line);
        }
    }
    console.log(`\nSearch finished.`);
}

main();
