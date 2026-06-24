Hermes durable confirmation fix

Upload/replace production file:
- server.js -> /home/apexilvn/smm-boosting-website-v2/server.js

Do not replace your live .env with .env.example. It is reference only.

Critical fix:
Hermes pending owner confirmations are now persisted in config.json. This fixes cPanel/Passenger process restart or multi-worker cases where:
1. Owner sends: On maintenance mode
2. Hermes says: Reply YES to proceed
3. Owner sends: YES
4. Old code may lose pending state and fail/fake chat instead of executing

Expected Telegram flow after deploy/restart:
- Send: On maintenance mode
- Hermes prepares action and says current OFF target ON
- Send: YES
- Hermes executes and writes config.json maintenanceMode=true

Verified locally:
- node --check server.js
- npm run test:hermes
- 13/13 tests pass, including pending confirmation persistence
