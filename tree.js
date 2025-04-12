const fs = require('fs');
const path = require('path');

let output = '';

function printTree(dir, prefix = '') {
  let files = fs.readdirSync(dir);
  files = files.filter(f => f !== 'node_modules' && f !== '.git');
  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const newPrefix = prefix + (isLast ? '└── ' : '├── ');
    const filePath = path.join(dir, file);
    output += newPrefix + file + '\n';
    if (fs.statSync(filePath).isDirectory()) {
      printTree(filePath, prefix + (isLast ? '    ' : '│   '));
    }
  });
}

printTree('.');
fs.writeFileSync('structure.txt', output);
console.log('✅ Structure written to structure.txt');
