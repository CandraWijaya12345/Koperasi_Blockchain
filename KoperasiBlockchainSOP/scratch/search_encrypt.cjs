const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchInDir(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.cjs')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes('encrypt')) {
                console.log(`Found 'encrypt' in: ${fullPath}`);
                // Print lines containing encrypt
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes('encrypt')) {
                        console.log(`  Line ${index + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchInDir(rootDir);
