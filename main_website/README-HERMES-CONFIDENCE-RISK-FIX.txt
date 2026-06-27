Hermes confidence/risk consistency fix

What changed:
- Recomputes confidence after historical-repeat-activity is added.
- Caps risk score by confidence consistently:
  LOW confidence: max 50
  MEDIUM confidence: max 80
  HIGH confidence: up to 100
- Stored/old firewall events are normalized when Hermes explains risk in Telegram.

Why:
- Live cPanel curl checks were reported as HIGH with LOW confidence after repeated test requests.
- That contradicted the Hermes rule that HIGH/CRITICAL needs multiple correlated indicators.

Deploy:
1. Upload server.js to /home/apexilvn/smm-boosting-website-v2/server.js
2. Restart the Node.js app in cPanel.
3. Optional syntax check:
   /home/apexilvn/nodevenv/smm-boosting-website-v2/18/bin/node --check server.js

Verified locally:
- node --check server.js
- node --check tests/hermes-owner-command-parser.test.js
- node --test --test-concurrency=1 tests/hermes-owner-command-parser.test.js
