# Hermes Firewall, Mobile Stability, and WhatsApp Floating Icon Fix

Date: 2026-06-05

## What changed

- Fixed the floating WhatsApp icon disappearing on the support tickets tab by removing the CSS rule that hid `#messenger-fab` and `.messenger-fab`.
- Added an explicit mobile/coarse-pointer override to keep the WhatsApp floating icon visible and clickable on touch devices.
- Kept the mobile stability CSS patch in the served production CSS asset.
- Updated Hermes website bug check detection so it recognizes the mobile stability and coarse-pointer CSS even when CSS whitespace/minification changes.
- Changed Hermes app firewall auto-block default to OFF. Hermes now logs/monitors by default unless `HERMES_APP_FIREWALL_AUTO_BLOCK=true` is explicitly set.
- Added trusted owner IP support through `HERMES_OWNER_IPS`, `HERMES_TRUSTED_IPS`, `HERMES_FIREWALL_TRUSTED_IPS`, or `OWNER_IPS`.

## Important production note

If an owner IP is already in `config.json` blocked IPs on cPanel, this code change will not automatically remove that old block entry. Unblock it through Hermes/admin tools or remove it from the production blocklist.

Recommended production env behavior:

```txt
HERMES_APP_FIREWALL_AUTO_BLOCK=false
```

Optional if you still want a trusted allowlist:

```txt
HERMES_OWNER_IPS=136.158.82.155
```

Use commas for multiple IPs.

## Verification

- `node --check server.js` passed.
- `node --check app.js` passed.
- `npm run test:hermes` passed: 13/13.
- Local smoke test passed:
  - `/` returned HTTP 200.
  - `/style.min.css` returned HTTP 200.
  - `Mobile stability patch` detected.
  - `pointer: coarse` detected.
  - `#messenger-fab` detected.
  - Old support-ticket WhatsApp hide rule not detected.

## Files to upload/extract

Extract the ZIP in:

```txt
/home/apexilvn/smm-boosting-website-v2
```

Then restart the Node.js app from cPanel.
