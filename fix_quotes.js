const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.jsx')) results.push(file);
    });
    return results;
}
const files = walk('e:/new_project_main/frontend/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i=0; i<lines.length; i++) {
        if (lines[i].includes('import.meta.env.VITE_API_URL')) {
            lines[i] = lines[i].replace("')", "` )").replace("', ", "` , ");
        }
    }
    fs.writeFileSync(file, lines.join('\n'));
});
console.log('Fixed syntax errors');
