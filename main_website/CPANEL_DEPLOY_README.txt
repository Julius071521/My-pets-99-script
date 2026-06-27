ApexBoost - Namecheap cPanel Deploy Package
Build: 2026-06-16 (compare-mobile-v1 + Hermes Security + mobile fixes)

================================================================================
QUICK STEPS
================================================================================

1. Sa cPanel File Manager, pumunta sa app folder mo (hal. smm-boosting-website-v2).
2. Upload ang namecheap-deploy-ready.zip dito.
3. I-extract ang ZIP sa loob ng folder (overwrite kung update lang).
4. HUWAG palitan ang production .env sa server kung may live credentials na.
   - Kung wala pa, kopyahin ang .env.example → .env at lagyan ng tunay na values.
5. Sa cPanel: Setup Node.js App
   - Node.js version: 18 o mas mataas
   - Application mode: Production
   - Application startup file: app.js
6. Run npm install (Node.js App panel o Terminal).
7. Restart ang Node app.
8. Hard refresh ang browser (Ctrl+Shift+R) para makita ang bagong CSS/JS.

================================================================================
PRODUCTION .ENV CHECKLIST (cPanel Environment Variables)
================================================================================

DEMO_MODE=false
TURNSTILE_REQUIRED=true
PUBLIC_SITE_URL=https://apexsmmboosting.com

Ilagay ang live values para sa:
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET, SESSION_SECRET
- RKD_API_KEY (at iba pang provider keys)
- EMAIL_HOST, EMAIL_USER, EMAIL_PASS
- TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
- HERMES_TELEGRAM_* (kung enabled)
- OPENCLAW_* (kung enabled)

Huwag i-upload ang local .env mula sa PC — may DEMO_MODE at test passwords yun.

================================================================================
DATABASE
================================================================================

Kung bagong install: phpMyAdmin → import database.sql

================================================================================
FILES INCLUDED
================================================================================

app.js, server.js, package.json, package-lock.json
public/ (index.html, app.min.js, style.min.css, assets)
dashboard.html, admin-panel.html, config.json
database.sql, .env.example, .htaccess
NAMECHEAP_DEPLOY.md (detailed guide)

================================================================================
SUPPORT
================================================================================

Kung may error pagkatapos ng restart, tingnan ang Node.js App logs sa cPanel.
Karaniwang dahilan: kulang na env variable o hindi pa na npm install.