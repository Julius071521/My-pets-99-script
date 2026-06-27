# ApexBoost consolidated release - 2026-06-21

## cPanel deployment

1. Back up the production database and current application directory.
2. Upload the release ZIP to `/home/apexilvn/smm-boosting-website-v2`.
3. Extract it in that directory. Do not extract it into `public_html`.
4. Keep the production `.env`; the archive intentionally does not contain one.
5. In cPanel Terminal, run `npm install --omit=dev` in the application directory.
6. Restart the Node.js application from cPanel.
7. Purge Cloudflare cache, then verify `/`, `/status`, login, signup, OTP, and an authenticated dashboard page.

## Implemented in this release

- Signup step navigation, Cloudflare Turnstile rendering/token submission, retry/reset handling.
- Server-configured Turnstile site key with safe markup fallback.
- Password-strength feedback and stricter auth input metadata.
- Permanent default AI avatar asset and authenticated UI fallback.
- Request IDs, centralized error request IDs, origin checks for cookie-authenticated mutations, and account-aware rate-limit keys.
- CSP updates for legitimate Cloudflare resources.
- Status page, sitemap, canonical URL, and Open Graph metadata.
- Automated mojibake gate and release test command.
- Nodemailer security update; local dependency audit reported zero known vulnerabilities.
- Operational-control module for bounded TOTP verification, order transition validation, idempotency keys, provider circuit-breaker state, and financial reconciliation summaries.
- Staging-first database migration for revocable sessions, login history, admin 2FA state, provider health events, failed jobs, reconciliation records, and order idempotency.
- Password-safe `mysqldump` backup command that writes compressed backups and SHA-256 source manifests outside the public web root.
- Search-engine discovery rules that allow public pages while blocking API, dashboard, and admin paths.
- Factual footer trust messaging, visible system-status links, and removal of placeholder social links and unsupported uptime claims.
- Correct HTML content types for status, authenticated dashboard, and admin HTML responses.
- Status-page encoding cleanup and expanded mojibake regression coverage.
- Professional Services Catalog and Admin Operations layouts for desktop and mobile.
- Independent RKDPanel and SMMWorld balance checks, each showing source USD, converted PHP, latency, health, and error state.
- Aggregate provider-liquidity totals and exchange-rate/check timestamps.
- Non-blocking low-balance presentation and expandable audit-log values.
- Movable Hermes and OpenClaw launchers with pointer/touch dragging, viewport bounds, mobile bottom-navigation clearance, saved positions, keyboard movement, and reset controls.
- Lightweight assistant styling with readable labels, restrained effects, reduced-motion handling, and bounded desktop/mobile panels.
- WhatsApp floating control removed on mobile to reduce widget competition and preserve content space.

## Existing controls verified in the codebase

- Transaction ledger and atomic balance update paths.
- Admin audit logs and audit viewer paths.
- Duplicate order/balance protection and provider retry paths.
- Explicit order/payment state handling.

These controls still require production integration testing before they can be called operationally proven.

## Not auto-enabled by this release

- Admin password rotation and secret rotation.
- Two-factor authentication, device/session management, or four-eyes approvals.
- Enforcement of the new 2FA/session tables is not activated until the migration is applied and production admin recovery procedures are confirmed.
- Provider failover/health scoring without secondary provider credentials and routing rules.
- Distributed background queue and dead-letter infrastructure.
- Automated production database backups and tested restore procedures.
- Legal/privacy/refund policy wording and analytics consent rules.
- Full split of the large server and frontend files into independently deployable modules.
- Real payment, SMTP delivery, provider order, and destructive admin end-to-end tests.

These are not simple UI toggles. Enabling them without production-specific configuration could break authentication, financial records, or order processing.

## Release checks

- `npm run check:release`
- `npm audit --omit=dev`
- Confirm the response header `X-Request-ID` is present.
- `/api/health` can return HTTP 207 when one or more external dependencies are degraded; inspect its component results instead of treating every 207 as an application crash.
