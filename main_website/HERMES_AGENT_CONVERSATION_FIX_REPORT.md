# Hermes Agent Conversation Fix Report

Generated: 2026-06-05

## Fixed

- Hermes now parses natural multi-order owner commands such as:
  - `Pa cancel ng order nato`
  - multiple `#orderId` lines
  - bare line-start order IDs like `15610713`
- Multi-order cancel/refill commands are prepared as a pending owner action and require `YES` before execution.
- Hermes no longer treats those batch cancel/refill requests as generic customer-support draft messages.
- Recent customer order checks now return a concise Telegram summary instead of a raw SQL/audit-style dump.

## Safety

- Batch provider actions are capped to 10 order IDs.
- Hermes checks each order exists and whether provider config is available before preparing execution.
- Final/ineligible statuses are skipped before confirmation.
- Provider actions still require confirmation because cancel/refill cannot be reliably undone after the provider accepts the request.

## Verified

- `node --check server.js` passed.
- `node --check app.js` passed.
- `npm run test:hermes` passed: 13/13 tests.

## Upload Target

Extract the deployment ZIP in:

`/home/apexilvn/smm-boosting-website-v2`

Then restart the Node.js app in cPanel.
