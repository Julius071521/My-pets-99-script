Hermes conversational routing fix
Generated: 2026-06-05T08:26:32.0174211+08:00

Upload target:
/home/apexilvn/smm-boosting-website-v2/server.js

After upload:
1. Restart Node.js app in cPanel.
2. Test these Telegram messages:
   - Hey
   - Pano malalaman kung attacker ang suspicious ip
   - Pano malalaman kung attacker
   - Pwede malaman country ng suspicious IP
   - /firewall report

Expected behavior:
- Natural security questions answer conversationally and explain evidence/uncertainty.
- They no longer repeat the same "May security event... Blocked IP count" summary.
- Explicit /firewall report still returns the full deterministic report.
- "Hey" is short and natural, not a long canned intro.
- AI fallback receives a verified ops snapshot for broad website context, without inventing row-level live data.

Verification:
- node --check server.js
- npm run test:hermes
