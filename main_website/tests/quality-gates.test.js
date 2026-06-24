'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('production assets have no common mojibake markers', () => {
  const files = ['server.js', 'public/index.html', 'public/app.js', 'dashboard.html', 'admin-panel.html'];
  const marker = /(?:Ã|Â|â€|â™|â‚|âœ|âž|â†|â‡|âˆ|â‰|âŠ|â‹|âŒ|âŽ|â‘|â’|â“|â”|â•|â–|â—|ðŸ)/u;
  for (const file of files) assert.doesNotMatch(read(file), marker, file);
});

test('release includes request tracing, status page, sitemap, and password meter', () => {
  assert.match(read('server.js'), /X-Request-ID/);
  assert.match(read('server.js'), /app\.get\('\/status'/);
  assert.match(read('public/status.html'), /System status/);
  assert.match(read('public/sitemap.xml'), /<urlset/);
  assert.match(read('public/index.html'), /register-password-strength/);
  assert.match(read('public/app.js'), /updatePasswordStrength/);
});

test('public discovery and trust surfaces are production-safe', () => {
  const robots = read('public/robots.txt');
  const index = read('public/index.html');
  const status = read('public/status.html');
  assert.match(robots, /Allow:\s*\//);
  assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
  assert.match(robots, /Sitemap:\s*https:\/\/apexsmmboosting\.com\/sitemap\.xml/);
  assert.match(index, /href="\/status"/);
  assert.doesNotMatch(index, /99\.8% uptime/);
  assert.doesNotMatch(index, /href="#" aria-label=/);
  assert.doesNotMatch(status, /(?:Ã|Â|â€¦)/);
});

test('admin provider diagnostics aggregate RKDPanel and SMMWorld in USD and PHP', () => {
  const server = read('server.js');
  const app = read('public/app.js');
  const admin = read('admin-panel.html');
  assert.match(server, /async function checkAllProviderBalances/);
  assert.match(server, /totalBalancePhp/);
  assert.match(server, /providers:\s*aggregate\.providers/);
  assert.match(app, /data\.balancePhp/);
  assert.match(app, /data\.totalBalancePhp/);
  assert.match(admin, /admin-provider-balance-grid/);
  assert.match(admin, /original USD and converted PHP/);
});

test('Hermes and OpenClaw widgets support persistent bounded dragging', () => {
  const index = read('public/index.html');
  const app = read('public/app.js');
  const style = read('public/style.css');
  assert.match(index, /assistant-drag-grip/);
  assert.match(index, /data-reset-assistant="openclaw"/);
  assert.match(index, /data-reset-assistant="hermes"/);
  assert.match(app, /initMovableAssistants/);
  assert.match(app, /setPointerCapture/);
  assert.match(app, /clampPosition/);
  assert.match(app, /localStorage\.setItem\(storageKey/);
  assert.match(style, /fab-user-positioned/);
  assert.match(style, /MOBILE_NAV_CLEARANCE|mobile-bottom-nav-height|safe-area-inset-bottom/);
});
