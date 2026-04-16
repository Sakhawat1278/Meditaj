const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Extract both opening and closing tags in order from the line
    const regex = /<(div|AnimatePresence|motion\.div|form)\b|<\/(div|AnimatePresence|motion\.div|form)>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        if (fullMatch.startsWith('</')) {
            const tag = fullMatch.substring(2, fullMatch.length - 1);
            if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
                stack.pop();
            } else {
                console.log(`ERROR: Line ${lineNo} found ${fullMatch} but stack is [${stack.map(s => s.tag).join(' > ')}]`);
                if (stack.length > 0) stack.pop(); // Try to recover
            }
        } else {
            // Check if it's self-closing before adding to stack
            if (!line.includes(fullMatch + ' />')) {
                const tag = fullMatch.substring(1);
                stack.push({ tag, line: lineNo });
            }
        }
    }
});

if (stack.length > 0) {
    console.log('UNCLOSED TAGS:');
    stack.forEach(s => console.log(`${s.tag} (Line ${s.line})`));
} else {
    console.log('All matched!');
}
