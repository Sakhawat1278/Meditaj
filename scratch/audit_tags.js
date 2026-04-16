const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/admin/page.js', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
  const lineNo = i + 1;
  const openings = line.match(/<(div|AnimatePresence|motion\.div|form)\b/g) || [];
  const closings = line.match(/<\/(div|AnimatePresence|motion\.div|form)>/g) || [];

  openings.forEach(op => {
    // Check if self-closing
    if (!line.includes(op + ' />') && !line.includes(op.replace('<', '</') + '>')) {
       stack.push({ tag: op.substring(1), line: lineNo });
    }
  });

  closings.forEach(cl => {
    const tag = cl.substring(2, cl.length - 1);
    if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
      stack.pop();
    } else {
      console.log(`Mismatch at line ${lineNo}: Found ${cl} but expected ${stack.length > 0 ? stack[stack.length-1].tag : 'nothing'}`);
      if (stack.length > 0) stack.pop();
    }
  });
});

console.log('Unclosed tags:');
stack.forEach(s => console.log(`${s.tag} opened at line ${s.line}`));
