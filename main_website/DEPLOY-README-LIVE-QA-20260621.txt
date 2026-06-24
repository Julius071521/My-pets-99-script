ApexBoost live-QA fix package - 2026-06-21

Validated against https://apexsmmboosting.com/ using authenticated read-only checks on New Order, Add Funds, Services, History, Support, Developer API, and Popular Services.

Important deployment rules:
1. Extract into the Node application root containing app.js and server.js.
2. Preserve the hosting .env file; this archive intentionally excludes secrets.
3. Confirm TURNSTILE_REQUIRED=true and the production TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY remain set in the hosting environment.
4. Restart the Node application after extraction.
5. Purge Cloudflare cache so app.js?v=20260621-auth-v2 and codex-ui-v2.css?v=20260621-qa2 are served.

Main fixes:
- Cloudflare Turnstile is rendered and required for both Login and Sign Up.
- Login API rejects requests without a valid Turnstile token when TURNSTILE_REQUIRED=true.
- Hermes and WhatsApp floating overlays no longer cover dashboard forms.
- OpenClaw remains available as one compact support button in a safe fixed corner.
- Drag-helper accessibility text remains available to assistive technology but is no longer painted over the UI.
- Fixed-navbar clearance and responsive auth/dashboard layout are enforced.
- Root app.js is the Passenger/Node startup file; browser code remains under public/app.js.

QA: 36/36 automated tests passed with local Turnstile test keys. Live authenticated audit produced no application console errors and no horizontal overflow at 1440px or 390px.
