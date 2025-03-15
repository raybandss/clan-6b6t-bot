const fs = require('node:fs');
const path = require('node:path');

// Function to recursively list files and directories
function listFilesRecursive(dir, depth = 0, maxDepth = 4) {
    if (depth > maxDepth) return;
    
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const indent = '  '.repeat(depth);
            const itemPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                console.log(`${indent}📁 ${item.name}/`);
                listFilesRecursive(itemPath, depth + 1, maxDepth);
            } else if (item.name.endsWith('.js')) {
                // For JS files, try to load them and check if they have command data
                try {
                    const command = require(itemPath);
                    if (command.data) {
                        console.log(`${indent}📄 ${item.name} ✅ (Command: ${command.data.name})`);
                    } else {
                        console.log(`${indent}📄 ${item.name} ❌ (Not a command)`);
                    }
                } catch (error) {
                    console.log(`${indent}📄 ${item.name} ❌ (Error: ${error.message})`);
                }
            } else {
                console.log(`${indent}📄 ${item.name}`);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
}

// Start from the current directory
const startDir = __dirname;
console.log('=== Discord Bot Command Structure ===');
console.log(`Starting from: ${startDir}`);
console.log('');

// Look for the commands directory
const commandsDir = path.join(startDir, 'commands');
if (fs.existsSync(commandsDir)) {
    console.log('📁 commands/');
    listFilesRecursive(commandsDir, 1);
} else {
    console.log('❌ commands directory not found!');
    
    // Try to find it elsewhere
    console.log('\nSearching for commands directory...');
    const items = fs.readdirSync(startDir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.isDirectory()) {
            const subDir = path.join(startDir, item.name);
            const possibleCommandsDir = path.join(subDir, 'commands');
            
            if (fs.existsSync(possibleCommandsDir)) {
                console.log(`Found commands directory at: ${item.name}/commands/`);
                console.log('📁 ' + item.name + '/commands/');
                listFilesRecursive(possibleCommandsDir, 1);
            }
        }
    }
}

console.log('\n=== Other JS Files ===');
const jsFiles = fs.readdirSync(startDir).filter(file => file.endsWith('.js'));
for (const file of jsFiles) {
    console.log(`📄 ${file}`);
}