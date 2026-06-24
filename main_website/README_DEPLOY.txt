ApexBoost SMTP/Auth Hotfix Deploy Notes
Generated: 2026-06-10

Upload these files to the live app folder, preserving paths:

- server.js
- database.sql
- admin-panel.html
- dashboard.html
- public/index.html
- public/app.js
- public/app.min.js
- public/style.css
- public/style.min.css

Then update the live .env using ENV_UPDATE_SMTP_AUTH.txt and restart the Node app.

Fixes included:

- SMTP connect/send timeout is shorter, so wrong SMTP config returns JSON instead of hanging until Cloudflare/Passenger 502.
- EMAIL_SEND_ATTEMPTS defaults to 1 to avoid repeated long SMTP stalls.
- Signup no longer auto-verifies an account when SMTP fails.
- If signup created an unverified account but OTP email failed, a later signup retry with the same email refreshes the verification OTP instead of showing "already registered."
- Login/register/OTP/forgot/reset frontend handlers now safely parse JSON or plain-text/HTML server errors.
- Includes the current notification/Add Funds SMTP changes already present in this local source.

Post-upload checks:

1. Open https://apexsmmboosting.com/ and confirm the served app/style cachebuster is newer than the old admin-hermes-mobile-v9 build.
2. Test forgot password using a real existing account email.
3. Test signup with a new email and confirm it opens the OTP screen.
4. Check inbox and spam. SMTP server acceptance does not guarantee Gmail inbox placement.

Current evidence before upload:

- Local syntax check passed for server.js, public/app.js, and public/app.min.js.
- Local mock signup retry path no longer returns the old "already registered" dead end.
- Real SMTP send via 192.64.117.65:465 with TLS servername apexsmmboosting.com was accepted by the mail server.
- Live site was still serving old assets at the time this package was created, so live signup hotfix was not yet deployed.
