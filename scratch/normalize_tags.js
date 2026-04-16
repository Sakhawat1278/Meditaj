const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const normalized = content
    .replace(/<(div|AnimatePresence|motion\.div|form)\b/g, '\nOPEN_$1 ')
    .replace(/<\/(div|AnimatePresence|motion\.div|form)>/g, '\nCLOSE_$1\n')
    .replace(/\/>/g, ' SELF_CLOSE\n');

fs.writeFileSync('scratch/tags_normalized.txt', normalized);
console.log('Normalized tags to scratch/tags_normalized.txt');
