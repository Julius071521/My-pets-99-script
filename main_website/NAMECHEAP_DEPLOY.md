# Namecheap File Manager Deploy Guide

This package is prepared for a Namecheap cPanel Node.js deployment.

## Files to Upload

Upload `namecheap-deploy-ready.zip` from the project root to your target folder in cPanel File Manager, then extract it.

Expected extracted files:

- `app.js`
- `server.js`
- `package.json`
- `package-lock.json`
- `.env.example`
- `database.sql`
- `public/`
  - `public/app.min.js`
  - `public/style.min.css`

## Recommended Folder

Use your app folder, for example:

`/home/apexilvn/smm-boosting-website-v2`

## After Upload

1. Extract `namecheap-deploy-ready.zip` inside your app folder.
2. Keep the production `.env` already configured on cPanel. The ZIP intentionally does not include your local `.env`.

4. In cPanel, open `Setup Node.js App`.
5. Create or edit the Node app with:
   - `Node.js version`: `18` or higher
   - `Application mode`: `Production`
   - `Application root`: `smm-boosting-website-v2`
   - `Application startup file`: `app.js`
   - `Application URL`: your chosen domain or subdomain
6. Run `npm install` from the Node.js App panel or terminal.
7. Restart the app.

## Hermes Agent Telegram Confirmation

Set these in cPanel `Setup Node.js App` environment variables, not inside source files:

```env
HERMES_AGENT_ENABLED=true
HERMES_AGENT_NAME=Hermes Agent
HERMES_TELEGRAM_BOT_TOKEN=YOUR_NEW_BOT_TOKEN
HERMES_TELEGRAM_CHAT_ID=YOUR_NUMERIC_CHAT_ID
HERMES_TELEGRAM_WEBHOOK_SECRET=YOUR_LONG_RANDOM_SECRET
HERMES_TELEGRAM_AUTO_WEBHOOK=true
```

Important: the Telegram user or group must message/start the bot first. A bot cannot send the first message to a private user.

## Hermes VPS Bridge Access

If the external Hermes VPS agent should read website/admin/security status, set
these in cPanel `Setup Node.js App` environment variables:

```env
HERMES_BRIDGE_ENABLED=true
HERMES_BRIDGE_TOKEN=YOUR_LONG_RANDOM_SECRET
HERMES_BRIDGE_TRUSTED_IPS=72.61.113.82
```

Use a new long random token. Do not reuse your admin password, Telegram token,
DeepSeek key, or provider API keys.

After restart, the VPS agent can verify read-only access with:

```http
GET https://apexsmmboosting.com/api/hermes/bridge/status?limit=10
Authorization: Bearer YOUR_LONG_RANDOM_SECRET
```

## OpenClaw Website AI Help

If the website floating AI Help should answer through the OpenClaw agent on the
VPS, set these in cPanel `Setup Node.js App` environment variables:

```env
OPENCLAW_AGENT_ENABLED=true
OPENCLAW_API_URL=http://72.61.113.82:18790/api/website-ai-help
OPENCLAW_API_TOKEN=YOUR_VPS_OPENCLAW_WEBSITE_BRIDGE_TOKEN
OPENCLAW_TIMEOUT_MS=30000
OPENCLAW_TRUSTED_HOSTS=72.61.113.82
OPENCLAW_REPLY_LIMIT=5
OPENCLAW_REPLY_WINDOW_MS=36000000
```

The token must match `/etc/apexboost-agent-policy/openclaw-website-bridge.env`
on the VPS. Do not use your DeepSeek key, Telegram token, provider API key, or
admin password as this bridge token.

`OPENCLAW_REPLY_LIMIT=5` and `OPENCLAW_REPLY_WINDOW_MS=36000000` mean each
non-admin user gets 5 OpenClaw replies per 10 hours. Verified `admin` and
`super_admin` accounts are exempt.

For automation reports, use the evidence-first operations endpoint:

```http
GET https://apexsmmboosting.com/api/hermes/bridge/operations?limit=10&stuckHours=6
Authorization: Bearer YOUR_LONG_RANDOM_SECRET
```

This endpoint is read-only. It returns ticket/order facts, provider health,
suggested next actions, and `approvalRequired=true`; it does not submit provider
tickets, change orders, or claim that an action was completed.

If an agent finds a verified eligible provider action, it can prepare owner
approval without executing it:

```http
POST https://apexsmmboosting.com/api/hermes/bridge/propose-action
Authorization: Bearer YOUR_LONG_RANDOM_SECRET
Content-Type: application/json

{"ticketId":123}
```

or:

```json
{"orderId":"1538356","action":"refill"}
```

The app sends the prepared action to `HERMES_TELEGRAM_CHAT_ID`. The provider
action runs only if the owner replies `YES`; replying `NO` cancels it. Pending
approvals expire after 5 minutes.

After restart, an admin can verify configuration with:

- `GET /api/admin/hermes/status`
- `POST /api/admin/hermes/test-alert`

After restart, the app verifies the Telegram webhook and repairs a missing or
stale registration automatically. Set `HERMES_TELEGRAM_AUTO_WEBHOOK=false`
only if webhook registration is managed outside this app.

Then send `/start` or a support question to the bot. The webhook only replies to `HERMES_TELEGRAM_CHAT_ID`; other chats are rejected.

If `test-alert` returns `telegram-not-configured`, the token or chat ID is missing from the runtime environment. If Telegram rejects the request, regenerate the bot token in BotFather and recheck the numeric chat ID.

## Database

If your database tables are not created yet:

1. Open phpMyAdmin in cPanel.
2. Create/select your database.
3. Import `database.sql`.

## Notes

- Do not upload your local `.env` file if it contains private secrets you do not want copied from your PC.
- Do not upload local `node_modules`; install dependencies on the server with `npm install`.
- Use live provider credentials for production. Only enable demo mode intentionally with `DEMO_MODE=true`.
