const fs = require('fs');
const path = require('path');

const contractPath = path.join(__dirname, '..', 'src', 'Reconstructed_KoperasiSimpanPinjam.sol');
const outputPath = path.join(__dirname, 'KoperasiSimpanPinjam_flattened.sol');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

const loadedFiles = new Set();
let outputCode = '';

// We keep track of SPDX and pragma statements
outputCode += '// SPDX-License-Identifier: MIT\n';
outputCode += 'pragma solidity ^0.8.20;\n\n';

function resolveImportPath(currentFile, importPath) {
    if (importPath.startsWith('@openzeppelin/')) {
        return path.join(nodeModulesPath, importPath);
    }
    return path.resolve(path.dirname(currentFile), importPath);
}

function processFile(filePath) {
    const resolvedPath = path.resolve(filePath);
    if (loadedFiles.has(resolvedPath)) {
        return;
    }
    loadedFiles.add(resolvedPath);

    console.log('Processing:', resolvedPath);
    let content = fs.readFileSync(resolvedPath, 'utf8');

    // Remove comments, imports, spdx and pragmas line by line
    const lines = content.split('\n');
    const processedLines = [];

    for (let line of lines) {
        const trimmed = line.trim();
        // Skip SPDX-License-Identifier
        if (trimmed.includes('SPDX-License-Identifier')) {
            continue;
        }
        // Skip pragma solidity
        if (trimmed.startsWith('pragma solidity')) {
            continue;
        }
        // Handle imports
        if (trimmed.startsWith('import ')) {
            // Extract the path
            const match = line.match(/import\s+(?:["'](.*?)["']|.*?\s+from\s+["'](.*?)["'])/);
            if (match) {
                const importFile = match[1] || match[2];
                const fullImportPath = resolveImportPath(resolvedPath, importFile);
                processFile(fullImportPath);
            }
            continue;
        }
        processedLines.push(line);
    }

    outputCode += `// File: ${path.relative(nodeModulesPath, resolvedPath)}\n`;
    outputCode += processedLines.join('\n') + '\n\n';
}

processFile(contractPath);

fs.writeFileSync(outputPath, outputCode);
console.log('Flattened contract successfully written to:', outputPath);
