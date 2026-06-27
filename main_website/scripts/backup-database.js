'use strict';

const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Backup blocked: missing ${missing.join(', ')}`);
  process.exit(2);
}

const backupRoot = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
fs.mkdirSync(backupRoot, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(backupRoot, `${process.env.DB_NAME}-${stamp}.sql.gz`);
const manifestPath = `${outputPath}.json`;
const args = [
  '--single-transaction', '--quick', '--routines', '--triggers',
  '-h', process.env.DB_HOST,
  '-P', String(process.env.DB_PORT || 3306),
  '-u', process.env.DB_USER,
  process.env.DB_NAME
];

const child = spawn(process.env.MYSQLDUMP_PATH || 'mysqldump', args, {
  env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' },
  stdio: ['ignore', 'pipe', 'inherit']
});
const gzip = zlib.createGzip({ level: 9 });
const hash = crypto.createHash('sha256');
const output = fs.createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
child.stdout.on('data', (chunk) => hash.update(chunk));
child.stdout.pipe(gzip).pipe(output);

child.on('close', (code) => {
  if (code !== 0) {
    fs.rmSync(outputPath, { force: true });
    process.exit(code || 1);
  }
  output.on('close', () => {
    const manifest = {
      database: process.env.DB_NAME,
      createdAt: new Date().toISOString(),
      file: path.basename(outputPath),
      compressedBytes: fs.statSync(outputPath).size,
      sourceSha256: hash.digest('hex')
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    console.log(`Backup created: ${outputPath}`);
  });
});
