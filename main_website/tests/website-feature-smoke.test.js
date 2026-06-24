const assert = require('node:assert/strict');
const test = require('node:test');

const BASE_URL = (process.env.FEATURE_TEST_BASE_URL || 'http://127.0.0.1:3099').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.FEATURE_TEST_TIMEOUT_MS || 15000);

function url(pathname) {
  return `${BASE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

async function request(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url(pathname), {
      redirect: 'manual',
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function header(res, name) {
  return res.headers.get(name);
}

function assertStatus(res, expected, path) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert.ok(
    allowed.includes(res.status),
    `${path} returned HTTP ${res.status}; expected ${allowed.join(' or ')}`
  );
}

test('public pages load and dashboard is not public', async () => {
  const home = await request('/');
  assertStatus(home, 200, '/');
  assert.match(header(home, 'content-type') || '', /text\/html/i);

  const login = await request('/login');
  assertStatus(login, 200, '/login');
  assert.match(header(login, 'content-type') || '', /text\/html/i);

  const dashboard = await request('/dashboard');
  assertStatus(dashboard, 200, '/dashboard');
  assert.match(header(dashboard, 'content-type') || '', /text\/html/i);
  const dashboardHtml = await dashboard.text();
  assert.match(dashboardHtml, /id=["']main-nav["']/i, '/dashboard must serve only the SPA shell');
  assert.doesNotMatch(dashboardHtml, /id=["']dashboard-content["']/i, '/dashboard must not expose the protected dashboard fragment');
});

test('signup exposes a wired Cloudflare Turnstile flow', async () => {
  const home = await request('/signup');
  assertStatus(home, 200, '/signup');
  const html = await home.text();
  assert.match(html, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
  assert.match(html, /id=["']register-turnstile-wrap["']/);
  assert.match(html, /id=["']register-next-btn["']/);

  const script = await request('/app.js');
  assertStatus(script, 200, '/app.js');
  const javascript = await script.text();
  assert.match(javascript, /turnstile\.render\(/);
  assert.match(javascript, /turnstileToken/);
  assert.match(javascript, /registerNextBtn\.addEventListener/);
});

test('security headers are present on public pages', async () => {
  const res = await request('/');
  assertStatus(res, 200, '/');

  assert.equal(header(res, 'x-frame-options'), 'DENY');
  assert.equal(header(res, 'x-content-type-options'), 'nosniff');
  assert.match(header(res, 'strict-transport-security') || '', /max-age=/i);
  assert.match(header(res, 'content-security-policy') || '', /default-src 'self'/i);
  assert.match(header(res, 'referrer-policy') || '', /strict-origin-when-cross-origin/i);
});

test('sensitive project files are not publicly readable', async () => {
  const sensitivePaths = [
    '/.env',
    '/config.json',
    '/server.js',
    '/database.sql',
    '/.sftp-config.json',
    '/package.json',
    '/logs/production.log'
  ];

  for (const pathname of sensitivePaths) {
    const res = await request(pathname, { method: 'HEAD' });
    assert.ok(
      [403, 404, 405].includes(res.status),
      `${pathname} returned HTTP ${res.status}; expected blocked/not found`
    );
  }
});

test('public config endpoint is available and does not expose obvious secrets', async () => {
  const res = await request('/api/config');
  assertStatus(res, 200, '/api/config');
  assert.match(header(res, 'content-type') || '', /application\/json/i);

  const body = await res.json();
  const serialized = JSON.stringify(body).toLowerCase();
  const forbidden = [
    'db_password',
    'database_password',
    'jwt_secret',
    'telegram_bot_token',
    'deepseek_api_key',
    'rkd_api_key',
    'smmworld_api_key',
    'provider_api_key'
  ];

  for (const key of forbidden) {
    assert.equal(serialized.includes(key), false, `/api/config exposed secret-looking key: ${key}`);
  }
});

test('health endpoint responds with structured status', async () => {
  const res = await request('/api/health');
  assertStatus(res, [200, 207], '/api/health');
  assert.match(header(res, 'content-type') || '', /application\/json/i);

  const body = await res.json();
  assert.ok(['healthy', 'degraded'].includes(body.status), `unexpected health status: ${body.status}`);
  assert.ok(body.database && typeof body.database === 'object', 'missing database health details');
  assert.ok(body.providerApi && typeof body.providerApi === 'object', 'missing provider API health details');
});

test('authenticated APIs reject anonymous users', async () => {
  const guarded = [
    '/api/auth/session',
    '/api/auth/me',
    '/api/user/orders',
    '/api/tickets/user',
    '/api/admin/orders',
    '/api/admin/users'
  ];

  for (const pathname of guarded) {
    const res = await request(pathname);
    assert.ok(
      [401, 403, 302].includes(res.status),
      `${pathname} returned HTTP ${res.status}; expected auth rejection`
    );
  }
});

test('read-only service API responds or fails safely', async () => {
  const res = await request('/api/v2', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'services', compact: 'true', limit: '3' })
  });

  assert.ok([200, 207, 400, 503].includes(res.status), `/api/v2 returned unexpected HTTP ${res.status}`);
  assert.match(header(res, 'content-type') || '', /application\/json/i);

  const body = await res.json();
  assert.equal(typeof body, 'object');
  if (res.status === 200) {
    const items = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
    assert.ok(items.length <= 3 || body.pagination, 'services response should respect compact/limit or include pagination');
  }
});
