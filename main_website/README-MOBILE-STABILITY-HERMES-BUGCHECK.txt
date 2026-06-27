ApexBoost mobile stability + Hermes website bug checker
Generated: 2026-06-05T07:47:56.4688039+08:00

Upload targets:
/home/apexilvn/smm-boosting-website-v2/server.js
/home/apexilvn/smm-boosting-website-v2/public/index.html
/home/apexilvn/smm-boosting-website-v2/public/style.css
/home/apexilvn/smm-boosting-website-v2/public/style.min.css

After upload:
1. Restart Node.js app in cPanel.
2. Clear CDN/LiteSpeed/browser cache if enabled.
3. On mobile, open: https://apexsmmboosting.com/?v=20260605-mobile-stability
4. In Telegram, test Hermes:
   - hanap bug sa website mobile blinking
   - check frontend bugs

Local verification:
- node --check server.js
- node --check public/app.js
- npm run test:hermes
- local HTTP served style.min.css?v=20260605-mobile-stability
- served CSS contained mobile stability/coarse pointer patch

Notes:
- Mobile patch disables expensive continuous landing animations/backdrop blur on small/coarse-pointer screens only.
- Hermes bug checker is read-only HTTP/static verification. It does not pretend to visually inspect a real phone screen.
