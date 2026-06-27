# Hermes Tool Execution Pipeline Audit

Date: 2026-06-04

## Bugs Found

1. Argument extraction was too broad.
   - Natural-language phrases could be treated as values.
   - Example risk: `Read user record` could drift toward using a command word as the lookup value.

2. Unavailable responses were over-explained.
   - Hermes could return formatted metadata even when no tool executed.
   - That made non-execution look like a real tool result.

3. HTTP status checks were implicit.
   - Website status could use configured site URL instead of an explicit owner-supplied `url`.

4. Tool names did not fully match the deterministic policy.
   - Order and ticket lookups used older internal names.

5. JSON argument priority was not enforced.
   - JSON must win over `key: value` and `key=value` extraction.

## Root Cause

Hermes mixed deterministic data-tool routing with permissive natural-language parsing and generic fallback replies. When a deterministic lookup was underspecified, Hermes could still produce a structured-looking response.

## Files Affected

- `server.js`
- `HERMES_TOOL_PIPELINE_AUDIT.md`

## Fixes Applied

1. Added a runtime Hermes tool registry.
   - Data reports now return `UNAVAILABLE` if the tool name is not registered.

2. Replaced broad username/order/ticket capture.
   - Preferred inputs now use JSON, `key: value`, `key=value`, or explicit structured fields.
   - User lookups require `username:` or `email:`.
   - Balance lookups require `username:`.
   - Order lookups require `order_id:`.
   - Ticket lookups require `ticket_id:`.
   - HTTP checks require `url:`.

3. Added exact missing-argument responses.
   - `UNAVAILABLE: missing required argument username`
   - `UNAVAILABLE: missing required argument order_id`
   - `UNAVAILABLE: missing required argument ticket_id`
   - `UNAVAILABLE: missing required argument url`

4. Changed no-execution fallback.
   - If no deterministic tool executes, Hermes returns only `UNAVAILABLE`.

5. Updated tool names.
   - `hermes_db_order_lookup`
   - `hermes_db_ticket_lookup`
   - `hermes_http_status_check`

6. Updated HTTP checks.
   - Hermes now runs `hermes_http_status_check` only when an explicit URL is supplied.
   - Output includes `TOOL`, `URL`, `STATUS_CODE`, `CONTENT_LENGTH`, `RESPONSE_TIME_MS`, `TIMESTAMP`, and `VERIFIED`.

## Recommended Owner Test Commands

Use explicit arguments:

```text
USER_BALANCE username: apexsmmm
USER_LOOKUP username: apexsmmm
USER_COUNT
ORDER_LOOKUP order_id: 1538356
TICKET_LOOKUP ticket_id: 5
DB_CONNECTION_PROBE
DB_SCHEMA_LOOKUP
HTTP_CHECK url: https://apexsmmboosting.com
```

## Risk Level

Medium.

This makes Hermes stricter. Some casual commands that worked before may now return a missing-argument response until the owner supplies explicit fields. That is intentional to reduce hallucinated or misrouted data.
