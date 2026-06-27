Hermes maintenance truth fix
Generated: 2026-06-04T20:48:49.7997528+08:00

Upload target:
/home/apexilvn/smm-boosting-website-v2/server.js

After upload:
1. Restart the Node.js app in cPanel.
2. In Telegram: send "On maintenance mode", then reply "YES".
3. Visit https://apexsmmboosting.com/?verify-maintenance=1 in a private/incognito tab.

Expected behavior:
- If public site serves maintenance page, Hermes says public verification passed and VERIFIED: YES.
- If public site still serves normal homepage, Hermes says public verification did not pass and VERIFIED: NO.

What changed:
- config.json reads/writes use the absolute app path.
- config.json parsing tolerates UTF-8 BOM from editors.
- public maintenance middleware syncs from config.json on each request.
- Hermes maintenance action checks config, runtime, and public HTTP result before claiming verified success.
