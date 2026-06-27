# ApexBoost Production Stability Fix Report

Generated: 2026-06-05

## A. Fixed Files List

- `server.js`
- `PRODUCTION_STABILITY_FIX_REPORT.md`

## B. Root Cause Analysis

- `EMAIL_VERIFICATION_REQUIRED` was referenced in the login flow without a definition, which could throw a `ReferenceError` during login for unverified users.
- `getAuthUserFromReq` already exists in the active root `server.js`; the reported `ReferenceError` is likely from an older deployed copy, stale cPanel upload, or a different staged copy.
- The active root server did not use `window.fetch`, but it did call `fetch(...)` directly. A Node runtime without global fetch would fail. The server now uses `safeFetch`.
- JSON body parsing had no explicit size limit and malformed JSON handling was not isolated early enough.
- SQLi/body sanitization ran before `express.json()`, so JSON request bodies were not being inspected by that middleware.
- Provider API calls had timeout handling, but only one attempt and a redundant timeout race. Provider JSON parsing could fail noisily on malformed provider responses.
- SMTP sending retried only twice and did not validate invalid port values before building the transport.
- Turnstile verification had timeout handling but no local token reuse memory.

## C. Security Improvements

- Added `EMAIL_VERIFICATION_REQUIRED` as an env-backed constant with conservative default behavior.
- Added `safeFetch` based on `globalThis.fetch` and routed all active server-side fetch calls through it.
- Added JSON and URL-encoded body limits of `10mb`.
- Added explicit malformed JSON and payload-too-large API responses.
- Moved parsed-body sanitization after body parsing so it can inspect JSON request bodies.
- Expanded CORS whitelist defaults for main, `www`, admin subdomain, and local development origins without using wildcard `*`.
- Added short-lived hashed captcha token reuse protection.
- Improved global error middleware for CORS, malformed JSON, and oversized payloads.

## D. Performance Improvements

- Provider API calls now use one `AbortController` timeout instead of a separate timeout race.
- Provider calls now retry up to 3 times with exponential backoff.
- Provider responses validate content type / JSON shape before parsing.
- Structured provider error logs now include provider name, attempt number, duration, and timeout.

## E. Remaining Warnings

- I did not prove every SQL query is injection-safe. Most reviewed user-facing queries are parameterized, but Hermes/admin helper paths still execute internally selected dynamic query strings. Those need a separate route-by-route trace before claiming complete SQLi closure.
- True provider failover only works when the same service/action has a usable secondary provider configuration. The patch improves retries and failure reporting; it does not invent equivalent cross-provider service mapping.
- SMTP invalid-login errors cannot be fixed in code if the actual cPanel/Gmail credentials are wrong. The code now retries and avoids crashing, but production credentials still need to be valid.
- Keeping the process alive after an uncaught exception matches the requested "no crash" behavior, but a supervised restart can be safer after unknown memory/state corruption.

## F. Recommended Production Settings for Namecheap Hosting

- `NODE_ENV=production`
- `DEMO_MODE=false`
- `PUBLIC_SITE_URL=https://apexsmmboosting.com`
- `ALLOWED_ORIGINS=https://apexsmmboosting.com,https://www.apexsmmboosting.com,https://admin.apexsmmboosting.com`
- `EMAIL_HOST=mail.apexsmmboosting.com`
- `EMAIL_PORT=465`
- `EMAIL_SECURE=true`
- `EMAIL_USER=<real mailbox>`
- `EMAIL_PASS=<real mailbox password or app password>`
- `EMAIL_VERIFICATION_REQUIRED=true`
- `TURNSTILE_REQUIRED=true`
- `TURNSTILE_SECRET_KEY=<Cloudflare Turnstile secret>`
- `JWT_SECRET=<long random secret>`
- `SESSION_SECRET=<long random secret>`
- `DB_HOST=localhost`
- `DB_USER=<Namecheap MySQL user>`
- `DB_PASSWORD=<Namecheap MySQL password>`
- `DB_NAME=<Namecheap MySQL database>`

## G. Deployment Checklist

- Upload the updated root `server.js`.
- Restart the Node app in cPanel / Passenger.
- Confirm production `.env` has real SMTP, DB, JWT/session, provider, and Turnstile secrets.
- Test `/` loads.
- Test login with a verified account.
- Test login/register with Turnstile enabled.
- Test forgot-password email and verify SMTP logs show accepted messages.
- Test `/api/v2` services with provider API enabled.
- Confirm CORS allows only the intended domains.
- Keep this report with the deploy package for audit reference.

## Verification Performed

- `node --check server.js` passed.
- Local demo boot probe passed: `/` returned `200`.
- Unauthenticated session probe returned `401`, as expected.
- Malformed JSON POST returned `400`, not a process crash.
- Active root `server.js` has no direct `fetch(...)`, `window.fetch`, or `typeof window` occurrences after patching.
