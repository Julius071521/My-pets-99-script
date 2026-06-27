ApexBoost feature smoke tests

Purpose:
- Quick read-only checks for the live website.
- Tests public pages, auth guards, security headers, sensitive-file exposure,
  /api/config, /api/health, and read-only services API behavior.
- Does not create orders, deposits, users, tickets, files, or database rows.

Files:
- tests/website-feature-smoke.test.js
- package.json scripts:
  npm run test:features
  npm run test:features:live

Run on cPanel live site:
cd /home/apexilvn/smm-boosting-website-v2
FEATURE_TEST_BASE_URL=https://apexsmmboosting.com /home/apexilvn/nodevenv/smm-boosting-website-v2/18/bin/node --test --test-concurrency=1 tests/website-feature-smoke.test.js

Run locally:
1. Start the server on a test port.
2. Run:
FEATURE_TEST_BASE_URL=http://127.0.0.1:3099 node --test --test-concurrency=1 tests/website-feature-smoke.test.js

Expected:
- 7 tests pass.

If a test fails:
- A 200 on .env/config.json/server.js/database.sql is urgent.
- A missing security header is a hardening issue.
- /dashboard returning 200 without login may mean auth guard regression.
- /api/health can return 207 when degraded; that is a warning, not always a crash.
