'use strict';

const crypto = require('crypto');

const ORDER_TRANSITIONS = Object.freeze({
  pending: new Set(['processing', 'failed', 'cancelled']),
  processing: new Set(['completed', 'failed', 'refunded', 'cancelled']),
  failed: new Set(['processing', 'refunded']),
  completed: new Set(['refunded']),
  cancelled: new Set(['refunded']),
  refunded: new Set()
});

function normalizeState(value) {
  return String(value || '').trim().toLowerCase();
}

function canTransitionOrder(from, to) {
  const source = normalizeState(from);
  const target = normalizeState(to);
  return source === target || Boolean(ORDER_TRANSITIONS[source]?.has(target));
}

function requireTransition(from, to) {
  if (!canTransitionOrder(from, to)) {
    const error = new Error(`Invalid order transition: ${from} -> ${to}`);
    error.code = 'INVALID_ORDER_TRANSITION';
    throw error;
  }
}

function createIdempotencyKey({ userId, serviceId, link, quantity, clientKey }) {
  if (clientKey && /^[A-Za-z0-9:_-]{16,128}$/.test(clientKey)) return clientKey;
  const bucket = Math.floor(Date.now() / 30000);
  return crypto.createHash('sha256')
    .update([userId, serviceId, String(link || '').trim(), quantity, bucket].join('|'))
    .digest('hex');
}

function sessionFingerprint(req) {
  const ip = String(req?.headers?.['cf-connecting-ip'] || req?.ip || '').trim();
  const agent = String(req?.headers?.['user-agent'] || '').trim().slice(0, 300);
  return crypto.createHash('sha256').update(`${ip}|${agent}`).digest('hex');
}

function generateTotpSecret() {
  return crypto.randomBytes(20).toString('hex');
}

function totpCode(secretHex, timestamp = Date.now(), stepSeconds = 30, digits = 6) {
  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', Buffer.from(secretHex, 'hex')).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits);
  return String(number).padStart(digits, '0');
}

function verifyTotp(secretHex, candidate, options = {}) {
  const clean = String(candidate || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean) || !/^[a-f0-9]{40}$/i.test(String(secretHex || ''))) return false;
  const now = Number(options.timestamp || Date.now());
  const window = Math.max(0, Math.min(2, Number(options.window ?? 1)));
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = totpCode(secretHex, now + (offset * 30000));
    if (crypto.timingSafeEqual(Buffer.from(clean), Buffer.from(expected))) return true;
  }
  return false;
}

class ProviderCircuitBreaker {
  constructor({ failureThreshold = 4, cooldownMs = 60000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.providers = new Map();
  }

  state(name) {
    return this.providers.get(name) || { failures: 0, openedAt: 0, lastError: null };
  }

  canRequest(name, now = Date.now()) {
    const state = this.state(name);
    return state.failures < this.failureThreshold || now - state.openedAt >= this.cooldownMs;
  }

  recordSuccess(name) {
    this.providers.set(name, { failures: 0, openedAt: 0, lastError: null });
  }

  recordFailure(name, error, now = Date.now()) {
    const previous = this.state(name);
    const failures = previous.failures + 1;
    this.providers.set(name, {
      failures,
      openedAt: failures >= this.failureThreshold ? now : previous.openedAt,
      lastError: String(error?.message || error || 'provider failure').slice(0, 500)
    });
  }

  snapshot(now = Date.now()) {
    return [...this.providers.entries()].map(([provider, state]) => ({
      provider,
      healthy: this.canRequest(provider, now),
      failures: state.failures,
      lastError: state.lastError
    }));
  }
}

function reconciliationSummary({ ledgerTotal, balanceTotal, providerCostTotal, customerChargeTotal }) {
  const ledger = Number(ledgerTotal || 0);
  const balances = Number(balanceTotal || 0);
  const providerCost = Number(providerCostTotal || 0);
  const customerCharge = Number(customerChargeTotal || 0);
  return {
    ledgerTotal: ledger,
    balanceTotal: balances,
    balanceVariance: Number((balances - ledger).toFixed(4)),
    providerCostTotal: providerCost,
    customerChargeTotal: customerCharge,
    grossMargin: Number((customerCharge - providerCost).toFixed(4)),
    balanced: Math.abs(balances - ledger) < 0.0001
  };
}

module.exports = {
  ORDER_TRANSITIONS,
  ProviderCircuitBreaker,
  canTransitionOrder,
  createIdempotencyKey,
  generateTotpSecret,
  reconciliationSummary,
  requireTransition,
  sessionFingerprint,
  totpCode,
  verifyTotp
};
