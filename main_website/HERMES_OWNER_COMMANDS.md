# Hermes Owner Commands

Use these through the private Telegram chat after the updated server is deployed and restarted.

## Verified Lookup Commands

These do not change data:

```text
USER_BALANCE username: apexsmmm
USER_LOOKUP username: apexsmmm
USER_COUNT
ORDER_LOOKUP order_id: 1538356
TICKET_LOOKUP ticket_id: 5
HTTP_CHECK url: https://apexsmmboosting.com
provider check
firewall status
```

## Natural Owner Questions

These should answer in a short human style instead of raw `ACTION/RESULT` logs:

```text
status ng website
ano lagay ng website ko
may umaattack ba sa website?
may suspicious IP ba?
ano ang IP nya?
ano ginawa ng attacker?
delikado ba ginagawa nitong IP address na ito?
bakit unavailable?
```

## Risky Owner Commands

These require `YES` confirmation before execution:

```text
add funds 500 to apexsmmm
refill order 1538356
cancel order 1538356
refund order 1538356
set order 1538356 status Completed
block user apexsmmm
unblock user apexsmmm
delete user apexsmmm
restore user apexsmmm
approve deposit 123
reject deposit 123
reply ticket 5: Hi, your request is now being reviewed.
done ticket 5
reject ticket 5: Hi, after checking, we cannot process this request.
maintenance on
maintenance off
rollback last
```

## Direct Owner Commands

These execute without confirmation because they are read-only or low-risk:

```text
/help
/tools
/examples
/knowledge
sync services
provider check
firewall status
audit recent 5
/permissions
```

## Hard Safety Rule

`delete user ...` is a soft-delete only. Hermes sets the account status to `Deleted`; it does not hard-delete user records, orders, tickets, deposits, or transactions.

Money actions such as add-funds and approved deposits are not auto-rolled back. Use an explicit verified correction command if money must be corrected.
