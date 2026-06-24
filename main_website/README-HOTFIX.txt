ApexBoost stderr hotfix

Upload targets:
- app.js -> /home/apexilvn/smm-boosting-website-v2/app.js
- server.js -> /home/apexilvn/smm-boosting-website-v2/server.js

Why:
- Production stderr shows root app.js is browser JS and crashes with window is not defined.
- Production stderr also shows getAuthUserFromReq is not defined; server.js now has a compatibility helper and latest Hermes routing fixes.

After upload:
- Restart Node/Passenger app in cPanel.
- Clear stderr.log and test site + Telegram.
