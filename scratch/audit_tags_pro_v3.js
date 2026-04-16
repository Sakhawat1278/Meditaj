const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Sequential regex for openings, closings, and specifically self-closing tags
    const regex = /<(div|AnimatePresence|motion\.div|form)\b|<\/(div|AnimatePresence|motion\.div|form)>|<(div|AnimatePresence|motion\.div|form)\b[^>]*\/>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        if (fullMatch.includes('/>')) {
            // Self-closing: ignore it for stack
            continue;
        }
        if (fullMatch.startsWith('</')) {
            const tag = fullMatch.substring(2, fullMatch.length - 1);
            if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
                stack.pop();
            } else {
                console.log(`ERROR: Line ${lineNo} found ${fullMatch} but expected ${stack.length > 0 ? stack[stack.length-1].tag : 'nothing'}`);
                if (stack.length > 0) stack.pop(); 
            }
        } else {
            const tag = fullMatch.substring(1).split(' ')[0].split('>')[0];
            stack.push({ tag, line: lineNo });
        }
    }
});

if (stack.length > 0) {
    console.log('UNCLOSED TAGS:');
    stack.forEach(s => console.log(`${s.tag} (Line ${s.line})`));
} else {
    console.log('All matched!');
}
