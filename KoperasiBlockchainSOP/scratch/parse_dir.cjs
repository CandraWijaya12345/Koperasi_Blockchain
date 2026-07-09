const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../.system_generated/tasks/task-6181.log');
// Wait, task-6181.log might not be at that path exactly. Let's search inside the App Data Directory:
// C:\Users\Candra Wijaya\.gemini\antigravity-ide\brain\1e646a3a-efd3-424b-9446-1b54288c14c5\.system_generated\tasks\task-6181.log
const absolutePath = "C:\\Users\\Candra Wijaya\\.gemini\\antigravity-ide\\brain\\1e646a3a-efd3-424b-9446-1b54288c14c5\\.system_generated\\tasks\\task-6181.log";

try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    const regex = /href="([^"]+)"/g;
    let match;
    console.log("All Links found in directory HTML:");
    while ((match = regex.exec(content)) !== null) {
        const l = match[1];
        if (!l.includes('..') && !l.startsWith('?') && !l.includes('data:')) {
            console.log(l);
        }
    }
} catch (e) {
    console.error(e);
}
