Hermes risk/ASN response fix

Fixed:
- Stored firewall events are normalized before Telegram follow-up replies.
- Single-indicator events are capped to 50/100 on read, even if old config.json stored a higher score.
- Risk replies now show Risk Score, Risk Level, Confidence, Evidence, Reasoning, and Recommended Action.
- ASN unavailable responses now explain why ASN is missing.

Verified:
- node --check server.js
- node --check tests/hermes-owner-command-parser.test.js
- node --test --test-concurrency=1 tests/hermes-owner-command-parser.test.js => 14 passed

Deploy:
- Replace server.js in the cPanel Node app root.
- Restart the Node app.
- The test file is included for reference/local verification only.
