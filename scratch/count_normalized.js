const fs = require('fs');
const content = fs.readFileSync('scratch/tags_normalized.txt', 'utf8');
const opens = (content.match(/OPEN_div/g) || []).length;
const closes = (content.match(/CLOSE_div/g) || []).length;
const self = (content.match(/SELF_CLOSE/g) || []).length;

console.log(`OPEN_div: ${opens}`);
console.log(`CLOSE_div: ${closes}`);
console.log(`SELF_CLOSE: ${self}`);

console.log(`Mismatch: ${opens - closes}`);
