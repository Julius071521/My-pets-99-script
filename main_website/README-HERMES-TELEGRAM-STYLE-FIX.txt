Hermes Telegram style and repetition fix
Generated: 2026-06-05T07:59:51.8544210+08:00

Upload target:
/home/apexilvn/smm-boosting-website-v2/server.js

After upload:
1. Restart Node.js app in cPanel.
2. In Telegram, test:
   - website bug check
   - ip lookup 1.1.1.1
   - On maintenance mode
   - /ask draft reply: customer says order is slow

What changed:
- Owner/tool reports are now concise Telegram HTML with emoji and bold labels.
- Removed default raw ACTION / RESULT / TOOL / EXECUTION_ID dump style from action/data report formatter.
- Technical evidence is still included briefly: Verified, Source, Tool, Run, Time.
- Conversational replies get a short Hermes header and Telegram HTML rendering.
- Telegram HTML parse failures retry as plain text so messages do not disappear.
- AI fallback prompt now explicitly avoids repeated canned replies and generic support-team wording.

Verification:
- node --check server.js
- npm run test:hermes
