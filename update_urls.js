const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.jsx')) results.push(file);
    });
    return results;
}
const files = walk('e:/new_project_main/frontend/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/'http:\/\/localhost:8000\/api/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api");
    content = content.replace(/`http:\/\/localhost:8000\/api/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api");
    fs.writeFileSync(file, content);
});
console.log('Updated frontend files for dynamic routing!');
