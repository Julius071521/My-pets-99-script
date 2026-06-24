'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = ['server.js', 'public/index.html', 'public/app.js', 'public/status.html', 'dashboard.html', 'admin-panel.html'];
const mojibake = /(?:Ã|Â|â€|â™|â‚|âœ|âž|â†|â‡|âˆ|â‰|âŠ|â‹|âŒ|âŽ|â‘|â’|â“|â”|â•|â–|â—|ðŸ)/u;
const failures = [];

for (const relative of files) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  text.split(/\r?\n/).forEach((line, index) => {
    if (mojibake.test(line)) failures.push(`${relative}:${index + 1}`);
  });
}

if (failures.length) {
  console.error(`Mojibake detected in ${failures.length} line(s):`);
  console.error(failures.slice(0, 50).join('\n'));
  process.exit(1);
}
console.log(`Mojibake check passed for ${files.length} production files.`);
