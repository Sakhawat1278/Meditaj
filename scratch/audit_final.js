const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Sequential regex for openings and closings
    const regex = /<(div|AnimatePresence|motion\.div|form|DashboardLayout)\b|<\/(div|AnimatePresence|motion\.div|form|DashboardLayout)>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        
        // Check for self-closing in the original line at this position
        const restOfLine = line.substring(match.index);
        const tagEndIndex = restOfLine.indexOf('>');
        const tagString = restOfLine.substring(0, tagEndIndex + 1);
        if (tagString.trim().endsWith('/>')) {
            // Self-closing
            continue;
        }

        if (fullMatch.startsWith('</')) {
            const tag = fullMatch.substring(2, fullMatch.length - 1);
            if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
                stack.pop();
            } else {
                console.log(`ERROR: Line ${lineNo} found ${fullMatch} but stack is [${stack.map(s => s.tag).join(' > ')}]`);
                // Find and remove matching tag from stack to try to recover
                const idx = stack.map(s => s.tag).lastIndexOf(tag);
                if (idx !== -1) {
                   stack.splice(idx, 1);
                }
            }
        } else {
            const tag = fullMatch.substring(1).split(' ')[0].split('>')[0];
            stack.push({ tag, line: lineNo });
        }
    }
});

console.log('FINAL UNCLOSED STACK:');
stack.forEach(s => console.log(`${s.tag} (Line ${s.line})`));
