ApexBoost support, widget, and UI QA package - 2026-06-22

Upload the ZIP contents to the website application root. Preserve the production .env and config.json files.

Included fixes:
- Human Support shows Telegram @Apexsmmboosting and the existing official WhatsApp Business link.
- Hermes, OpenClaw, and WhatsApp widgets are no longer globally hidden by CSS.
- Sidebar profile and wallet balance have improved contrast and hierarchy.
- Services Directory desktop columns no longer overlap.
- Mobile support content has safe bottom spacing for the widget dock and bottom navigation.
- Services Directory actions remain visible on desktop and mobile without clipped horizontal controls.
- Order History rows become readable mobile cards; status filters remain intentionally swipeable.
- Admin navigation wraps on desktop instead of hiding later sections off-screen.
- OpenClaw, Hermes, and WhatsApp icons can be dragged with mouse or touch and keep their saved positions.
- Widget position restore no longer fights active dragging or snaps the icon back.
- Asset cache versions were bumped; the live site must serve widget-drag-qa8 after deployment.

After upload:
1. Restart the Node.js application.
2. Purge the Cloudflare cache.
3. Hard refresh the browser.

Do not overwrite production .env or config.json.
