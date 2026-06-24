Hermes IP lookup skill
Generated: 2026-06-04T21:24:41.5678793+08:00

Upload target:
/home/apexilvn/smm-boosting-website-v2/server.js

After upload:
1. Restart the Node.js app in cPanel.
2. In Telegram, try:
   - ip lookup 1.1.1.1
   - check IP 8.8.8.8 country/asn
   - ano country ng 165.154.51.90

Expected output:
- Country
- ASN/Network
- Source, usually ipwho.is
- VERIFIED: YES only when country or ASN data is resolved

Optional env knobs already supported:
HERMES_IP_INTEL_ENABLED=true
HERMES_IP_INTEL_TIMEOUT_MS=2500
