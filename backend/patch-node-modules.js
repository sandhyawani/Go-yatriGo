const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'node_modules', 'buffer-equal-constant-time', 'index.js');

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  const target = "var SlowBuffer = require('buffer').SlowBuffer;";
  const replacement = "var SlowBuffer = require('buffer').SlowBuffer || Buffer;";
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Patched buffer-equal-constant-time for Node.js compatibility.');
  }
}
