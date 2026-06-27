ApexBoost log-error hotfix

Fixed:
0. ReferenceError: window is not defined from root app.js.
   - Cause: cPanel was running a browser/frontend app.js as the Node entry point.
   - Fix: included a safe root app.js wrapper that loads server.js.

1. PayloadTooLargeError from Express default 100KB body limit.
   - Added REQUEST_BODY_LIMIT env support, default 2mb.
   - Oversized bodies now return HTTP 413 instead of generic 500/unhandled error log.

2. EMAIL_VERIFICATION_REQUIRED is not defined.
   - Added env-backed EMAIL_VERIFICATION_REQUIRED boolean, default true.

3. Noisy client-error logs for malformed JSON and blocked CORS origins.
   - Malformed JSON now returns HTTP 400.
   - Blocked CORS origin now returns HTTP 403.
   - These are logged as warnings, not generic server crashes.

4. Safer cPanel file layout.
   - Frontend assets belong inside public/.
   - Included maintenance.html so maintenance mode does not fail when enabled.

Upload/replace in cPanel app root:
- server.js
- app.js if your cPanel Node app entry point is app.js
- public/
- admin-panel.html
- dashboard.html

Do not upload env.example as your live .env. Use it only as reference.
If needed, add to cPanel environment variables:
REQUEST_BODY_LIMIT=2mb
EMAIL_VERIFICATION_REQUIRED=true
