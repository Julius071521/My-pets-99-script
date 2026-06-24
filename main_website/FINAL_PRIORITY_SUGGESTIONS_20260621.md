# ApexBoost final priority recommendations

## P0 - required before calling the release live

1. Deploy this complete archive to `/home/apexilvn/smm-boosting-website-v2`; production was still serving the older `v54` frontend during the 2026-06-21 audit.
2. Preserve the production `.env`, run `npm install --omit=dev`, restart the cPanel Node.js application, and purge Cloudflare cache.
3. Verify that production serves `style.css` and `app.js` with cache version `20260621-final-trust-v56`, `/status` opens as HTML, and responses contain `X-Request-ID`.
4. Rotate every password or secret previously shared outside the production secret manager.

## P1 - production operations

1. Back up the database before applying `migrations/001_operational_hardening.sql`; apply it on staging first.
2. Schedule `npm run backup:database` outside the public web root and perform a real restore drill. A backup that has never been restored is not proven.
3. Configure and verify SMTP, Turnstile hostname allowlisting, provider credentials, and Cloudflare cache rules.
4. Add monitoring for domain/SSL expiry, SMTP failures, provider latency, failed jobs, and reconciliation variance.

## P2 - product and governance decisions

1. Enforce admin 2FA and short re-authentication only after recovery codes and account-recovery procedures are tested.
2. Define thresholds for four-eyes approval on refunds and balance adjustments.
3. Supply a secondary provider plus routing and pricing rules before enabling failover.
4. Have the privacy, terms, refund, refill, cancellation, retention, and third-party-platform wording reviewed against actual business operations.
5. Replace generic support expectations with published support hours only when staffing can consistently meet them.

## Evidence from this release

- Live production returned the old `v54` assets and did not expose `/status` or `X-Request-ID` during the audit.
- Local release passed 34 automated tests and a zero-vulnerability dependency audit.
- Desktop 1440x900 and mobile 390x844 rendered QA passed with no horizontal overflow, no failed application requests, a working status link, and no status-page mojibake.

