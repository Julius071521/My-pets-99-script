const fs = require('fs');
const path = require('path');

const oldPath = path.join(__dirname, 'env');
const newPath = path.join(__dirname, '.env');

console.log('🔄 Checking for "env" file in directory...');

if (fs.existsSync(oldPath)) {
  try {
    fs.renameSync(oldPath, newPath);
    console.log('✅ Success! Successfully renamed "env" to ".env"!');
  } catch (error) {
    console.error('❌ Error renaming file:', error.message);
  }
} else if (fs.existsSync(newPath)) {
  console.log('✅ ".env" file already exists and is correctly named!');
} else {
  console.log('❌ Neither "env" nor ".env" was found in this folder!');
}
