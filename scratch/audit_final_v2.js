const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Sequential regex to find all opening and closing tags in order
    const regex = /<(div|AnimatePresence|motion\.div|form|DashboardLayout)\b|<\/(div|AnimatePresence|motion\.div|form|DashboardLayout)>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        
        // Check for self-closing by looking ahead in the line
        const rest = line.substring(match.index);
        const endOfTag = rest.indexOf('>');
        const fullTag = rest.substring(0, endOfTag + 1);
        
        if (fullTag.endsWith('/>')) {
            // console.log(`${lineNo}: SELF-CLOSE ${fullMatch.substring(1)}`);
            continue;
        }

        if (fullMatch.startsWith('</')) {
            const name = fullMatch.substring(2, fullMatch.length - 1);
            if (stack.length > 0) {
                const last = stack.pop();
                if (last.tag !== name) {
                    console.log(`ERROR Line ${lineNo}: Found </${name}> but expected </${last.tag}> (opened at ${last.line})`);
                }
            } else {
                console.log(`ERROR Line ${lineNo}: Found </${name}> but stack is empty`);
            }
        } else {
            const name = fullMatch.substring(1).split(' ')[0].split('>')[0];
            stack.push({ tag: name, line: lineNo });
        }
    }
});

if (stack.length > 0) {
    console.log('UNCLOSED:');
    stack.forEach(s => console.log(`${s.tag} (Line ${s.line})`));
} else {
    console.log('CLEAN!');
}
