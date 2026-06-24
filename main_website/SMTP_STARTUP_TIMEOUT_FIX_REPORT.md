# SMTP Startup Timeout Log Fix

Date: 2026-06-05

## Issue

`stderr.log` showed repeated startup messages:

```txt
SMTP transport verification failed: Connection timeout
```

This came from `transporter.verify()` running automatically every time the Node.js app started.

## What changed

- SMTP startup verification is now opt-in.
- Default behavior is to skip SMTP verification at boot.
- Actual email/OTP sending still uses SMTP on demand.
- SMTP timeout values can now be configured through env vars.

## Recommended cPanel env

```txt
SMTP_STARTUP_VERIFY=false
EMAIL_CONNECTION_TIMEOUT_MS=15000
EMAIL_GREETING_TIMEOUT_MS=10000
EMAIL_SOCKET_TIMEOUT_MS=20000
```

Keep your existing email credentials, but confirm the SMTP host/port from cPanel Email Accounts.

Common cPanel SMTP settings:

```txt
EMAIL_PORT=465
EMAIL_SECURE=true
```

Important: if the mail hostname is behind Cloudflare proxy, SMTP can timeout. SMTP hostnames should not be proxied through Cloudflare.

## Verification

- `node --check server.js` passed.
- `npm run test:hermes` passed: 13/13.
- Local boot smoke returned HTTP 200 and logged:

```txt
SMTP startup verification skipped. Set SMTP_STARTUP_VERIFY=true to verify SMTP at boot.
```

No startup SMTP timeout was emitted during the smoke test.

## Remaining uncertainty

This stops boot-time stderr spam. It does not prove live OTP delivery works. To prove delivery, run an actual SMTP delivery test after confirming the production SMTP host, username, and password.
