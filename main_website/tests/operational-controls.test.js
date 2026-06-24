'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ProviderCircuitBreaker,
  canTransitionOrder,
  createIdempotencyKey,
  generateTotpSecret,
  reconciliationSummary,
  totpCode,
  verifyTotp
} = require('../lib/operational-controls');

test('order state machine rejects impossible transitions', () => {
  assert.equal(canTransitionOrder('pending', 'processing'), true);
  assert.equal(canTransitionOrder('completed', 'processing'), false);
  assert.equal(canTransitionOrder('refunded', 'completed'), false);
});

test('idempotency keys are stable when supplied and scoped when generated', () => {
  const supplied = 'checkout:01J123456789ABCDEFGH';
  assert.equal(createIdempotencyKey({ clientKey: supplied }), supplied);
  const generated = createIdempotencyKey({ userId: 1, serviceId: 2, link: 'https://example.com/x', quantity: 100 });
  assert.match(generated, /^[a-f0-9]{64}$/);
});

test('TOTP verification uses a bounded clock window', () => {
  const secret = generateTotpSecret();
  const timestamp = 1770000000000;
  const code = totpCode(secret, timestamp);
  assert.equal(verifyTotp(secret, code, { timestamp }), true);
  assert.equal(verifyTotp(secret, '000000', { timestamp, window: 0 }), false);
});

test('provider circuit opens and recovers after cooldown', () => {
  const breaker = new ProviderCircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });
  breaker.recordFailure('primary', new Error('timeout'), 1000);
  breaker.recordFailure('primary', new Error('timeout'), 1100);
  assert.equal(breaker.canRequest('primary', 1500), false);
  assert.equal(breaker.canRequest('primary', 2200), true);
  breaker.recordSuccess('primary');
  assert.equal(breaker.snapshot(2200)[0].healthy, true);
});

test('financial reconciliation exposes variance and gross margin', () => {
  const summary = reconciliationSummary({ ledgerTotal: 100, balanceTotal: 99, providerCostTotal: 40, customerChargeTotal: 70 });
  assert.equal(summary.balanceVariance, -1);
  assert.equal(summary.grossMargin, 30);
  assert.equal(summary.balanced, false);
});
