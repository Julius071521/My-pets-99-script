const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');

const serverPath = path.join(__dirname, '..', 'server.js');
const source = fs.readFileSync(serverPath, 'utf8');
const trustedIpStart = source.indexOf('function getHermesTrustedOwnerIpsSet');
const trustedIpEnd = source.indexOf('// --- Production Hardening: Centralized Production Logger');
const start = source.indexOf('function parseHermesAddFundsCommand');
const end = source.indexOf('function createHermesExecutionId');

if (trustedIpStart < 0 || trustedIpEnd < 0 || trustedIpEnd <= trustedIpStart) {
  throw new Error('Unable to locate Hermes trusted IP helper block in server.js');
}

if (start < 0 || end < 0 || end <= start) {
  throw new Error('Unable to locate Hermes parser block in server.js');
}

function splitCsv(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

eval(source.slice(trustedIpStart, trustedIpEnd));
const getClientIpStart = source.indexOf('function getClientIp');
const getClientIpEnd = source.indexOf('async function verifyTurnstileToken');
if (getClientIpStart < 0 || getClientIpEnd < 0 || getClientIpEnd <= getClientIpStart) {
  throw new Error('Unable to locate getClientIp helper in server.js');
}
eval(source.slice(getClientIpStart, getClientIpEnd));

function toMoney(value, digits = 4) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return parseFloat(numeric.toFixed(digits));
}

function buildTicketCustomerStatusReply(status = '') {
  if (/reject/i.test(String(status))) return 'Rejected.';
  if (/done|approved/i.test(String(status))) return 'Completed.';
  return 'Pending.';
}

eval(source.slice(start, end));

const supportStart = source.indexOf('function isSupportStatsQuestion');
const firewallStart = source.indexOf('function isHermesSecurityStatusQuestion');
const firewallEnd = source.indexOf('async function executeHermesFirewallCommand');

if (firewallStart < 0 || firewallEnd < 0 || firewallEnd <= firewallStart) {
  throw new Error('Unable to locate Hermes firewall parser block in server.js');
}

if (supportStart < 0 || supportStart >= firewallStart) {
  throw new Error('Unable to locate Hermes support helper block in server.js');
}

eval(source.slice(supportStart, firewallStart));
eval(source.slice(firewallStart, firewallEnd));

test('Hermes trusted IPs bypass detection and persisted blocklist checks', () => {
  const previous = process.env.HERMES_FIREWALL_TRUSTED_IPS;
  const previousProxy = process.env.HERMES_TRUSTED_PROXY_IPS;
  process.env.HERMES_FIREWALL_TRUSTED_IPS = '72.61.113.82,2001:db8::/32,203.0.113.0/24';
  process.env.HERMES_TRUSTED_PROXY_IPS = '10.0.0.0/8';
  try {
    assert.equal(isHermesTrustedIp('72.61.113.82'), true);
    assert.equal(isHermesTrustedIp('::ffff:72.61.113.82'), true);
    assert.equal(isHermesTrustedIp('203.0.113.44'), true);
    assert.equal(isHermesTrustedIp('2001:db8::1'), true);
    assert.equal(isHermesTrustedIp('198.51.100.10'), false);
    assert.equal(isTrustedProxyAddress('192.168.1.20'), false);
    assert.equal(isTrustedProxyAddress('10.0.0.10'), true);
    assert.match(source, /!isHermesTrustedIp\(ip\) && getBlockedIpsSet\(\)\.has\(ip\)/);
    assert.doesNotMatch(source, /if \(isHermesTrustedIp\(ip\)\) return next\(\);/);
    assert.match(source, /whitelisted && !criticalThreat/);
    assert.match(source, /if \(!whitelisted \|\| criticalThreat\) enrichAndSendHermesFirewallAlert\(event\)/);
    const spoofedReq = {
      headers: { 'x-forwarded-for': '72.61.113.82' },
      socket: { remoteAddress: '198.51.100.9' },
      ip: '198.51.100.9'
    };
    assert.equal(getClientIp(spoofedReq), '198.51.100.9');
    const trustedProxyReq = {
      headers: { 'x-forwarded-for': '72.61.113.82, 198.51.100.9' },
      socket: { remoteAddress: '10.0.0.10' },
      ip: '10.0.0.10'
    };
    assert.equal(getClientIp(trustedProxyReq), '72.61.113.82');
  } finally {
    if (previous === undefined) delete process.env.HERMES_FIREWALL_TRUSTED_IPS;
    else process.env.HERMES_FIREWALL_TRUSTED_IPS = previous;
    if (previousProxy === undefined) delete process.env.HERMES_TRUSTED_PROXY_IPS;
    else process.env.HERMES_TRUSTED_PROXY_IPS = previousProxy;
  }
});

test('Hermes Telegram firewall alert buttons and duration workflow are wired', () => {
  assert.match(source, /function buildHermesFirewallTelegramButtons/);
  assert.match(source, /Allow \/ Whitelist IP/);
  assert.match(source, /Ban Permanently/);
  assert.match(source, /Ban Specific Days/);
  assert.match(source, /function handleHermesFirewallCallback/);
  assert.match(source, /function handleHermesPendingFirewallDayBanReply/);
  assert.match(source, /banDurationDays/);
  assert.match(source, /expiresAt/);
});

test('Hermes bridge uses scoped token access instead of admin sessions', () => {
  assert.match(source, /const HERMES_BRIDGE_ENABLED = String\(process\.env\.HERMES_BRIDGE_ENABLED \|\| 'false'\)/);
  assert.match(source, /function requireHermesBridge\(req, res, next\)/);
  assert.match(source, /timingSafeStringEqual\(getHermesBridgeTokenFromReq\(req\), HERMES_BRIDGE_TOKEN\)/);
  assert.match(source, /app\.get\('\/api\/hermes\/bridge\/status', requireHermesBridge/);
  assert.match(source, /app\.get\('\/api\/hermes\/bridge\/security', requireHermesBridge/);
  assert.match(source, /app\.get\('\/api\/hermes\/bridge\/operations', requireHermesBridge/);
  assert.match(source, /app\.post\('\/api\/hermes\/bridge\/propose-action', requireHermesBridge/);
  assert.doesNotMatch(source, /app\.get\('\/api\/hermes\/bridge\/status', requireAdmin/);
  assert.doesNotMatch(source, /app\.get\('\/api\/hermes\/bridge\/security', requireAdmin/);
  assert.doesNotMatch(source, /app\.get\('\/api\/hermes\/bridge\/operations', requireAdmin/);
  assert.doesNotMatch(source, /app\.post\('\/api\/hermes\/bridge\/propose-action', requireAdmin/);
});

test('Hermes operations bridge is evidence-first and approval gated', () => {
  assert.match(source, /async function getHermesBridgeOperationsSnapshot/);
  assert.match(source, /noFakeReports:\s*true/);
  assert.match(source, /unknownValue:\s*'UNAVAILABLE'/);
  assert.match(source, /writeActions:\s*'approval-required'/);
  assert.match(source, /browserLoginAutomation:\s*'disabled-for-this-bridge'/);
  assert.match(source, /approvalRequired:\s*true/);
  assert.match(source, /canExecuteNow:\s*false/);
  assert.match(source, /providerActionCandidates/);
});

test('Hermes bridge action proposals prepare owner approval instead of executing', () => {
  assert.match(source, /async function buildHermesBridgeActionProposal/);
  assert.match(source, /normalizeHermesBridgeProposalAction/);
  assert.match(source, /setHermesPendingCommand\(HERMES_TELEGRAM_CHAT_ID, proposal\.command/);
  assert.match(source, /sendHermesTelegramAlert\(prepared\.reply/);
  assert.match(source, /approvalRequired:\s*true/);
  assert.match(source, /canExecuteNow:\s*false/);
  assert.match(source, /Reply YES in Telegram to execute, or NO to cancel/);
  assert.doesNotMatch(source, /app\.post\('\/api\/hermes\/bridge\/propose-action'[\s\S]{0,3000}executeHermesOrderProviderCommand/);
});

let testRuntimeConfig = {
    blockedIps: ['77.83.39.21', '195.178.110.31'],
    hermesFirewallEvents: [{
      ip: '165.154.51.90',
      type: 'app-firewall',
      country: 'China',
      asn: 'AS14061 DigitalOcean LLC',
      geoSource: 'ipwho.is',
      severity: 'medium',
      riskLevel: 'MEDIUM',
      confidence: 'LOW',
      reasons: ['scanner-user-agent'],
      riskScore: 18,
      score: 18,
      count: 1,
      path: '/',
      method: 'GET',
      userAgent: 'scanner-test',
      blocked: false,
      recommendedAction: 'Allow + Monitor',
      createdAt: '2026-06-04T05:00:46.011Z',
      report: 'Threat Assessment\nfull report body'
    }]
  };
function readRuntimeConfig() {
  return testRuntimeConfig;
}

function writeRuntimeConfig(config) {
  testRuntimeConfig = config || {};
}

function hasResolvedHermesIpIntel(value = '') {
  const clean = String(value || '').trim();
  return Boolean(clean && clean !== 'UNAVAILABLE' && clean !== 'LOOKUP_PENDING');
}

function getHermesConfidence(indicatorCount) {
  if (indicatorCount >= 4) return 'HIGH';
  if (indicatorCount >= 2) return 'MEDIUM';
  return 'LOW';
}

function getHermesRiskLevel(score) {
  if (score >= 81) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 21) return 'MEDIUM';
  return 'LOW';
}

function getHermesRecommendedAction(riskLevel, confidence, blocked = false) {
  if (blocked || riskLevel === 'CRITICAL') return 'Immediate Block + Alert Admin';
  if (riskLevel === 'HIGH') return confidence === 'HIGH' ? 'Rate Limit + Challenge' : 'Monitor + Rate Limit';
  if (riskLevel === 'MEDIUM') return 'Monitor + Rate Limit';
  return 'Allow + Monitor';
}

function normalizeHermesThreatScore(score, indicatorCount) {
  const rawScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (indicatorCount <= 0) return 0;
  if (indicatorCount === 1) return Math.min(rawScore, 50);
  if (indicatorCount <= 3) return Math.min(rawScore, 80);
  return rawScore;
}

function normalizeHermesThreatScoreForConfidence(score, indicatorCount, confidence) {
  const normalized = normalizeHermesThreatScore(score, indicatorCount);
  if (confidence === 'LOW') return Math.min(normalized, 50);
  if (confidence === 'MEDIUM') return Math.min(normalized, 80);
  return normalized;
}

function normalizeCatalogText(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9_@#.:/=\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const dataStart = source.indexOf('const HERMES_SECRET_REQUEST_PATTERN');
const dataEnd = source.indexOf('function detectHermesUnroutedDataRequest');

if (dataStart < 0 || dataEnd < 0 || dataEnd <= dataStart) {
  throw new Error('Unable to locate Hermes data parser block in server.js');
}

eval(source.slice(dataStart, dataEnd));

const pendingStart = source.indexOf('const pendingHermesOwnerCommands');
const pendingEnd = source.indexOf('const HERMES_OWNER_TOOL_PERMISSIONS');

if (pendingStart < 0 || pendingEnd < 0 || pendingEnd <= pendingStart) {
  throw new Error('Unable to locate Hermes pending command block in server.js');
}

eval(source.slice(pendingStart, pendingEnd).replace('const pendingHermesOwnerCommands', 'var pendingHermesOwnerCommands'));

test('Hermes owner parsers accept exact risky commands', () => {
  assert.deepEqual(parseHermesAddFundsCommand('add funds 500 to apexsmmm'), {
    type: 'add_funds',
    username: 'apexsmmm',
    amount: 500
  });
  assert.deepEqual(parseHermesOrderProviderCommand('refill order 1538356'), {
    type: 'order_provider_action',
    action: 'refill',
    orderId: '1538356'
  });
  assert.deepEqual(parseHermesAmbiguousBulkProviderCommand('Pa refill lahat ng order ng customer ko, yung may mga refill button sakanilang orders'), {
    type: 'ambiguous_bulk_provider_action',
    action: 'refill',
    username: '',
    text: 'Pa refill lahat ng order ng customer ko, yung may mga refill button sakanilang orders'
  });
  assert.deepEqual(parseHermesBatchOrderProviderCommand(`Pa cancel ng order nato

#1561606
1 Jun, 12:03(yt views -completed but only 400 added)

#1561400 1 Jun, 05:54 (still in progress)

15610713 1 May, 20:05
(fb followers drop to 3k)`), {
    type: 'batch_order_provider_action',
    action: 'cancel',
    orderIds: ['1561606', '1561400', '15610713']
  });
  assert.deepEqual(parseHermesDepositActionCommand('approve deposit 123'), {
    type: 'deposit_action',
    action: 'approve',
    depositId: '123'
  });
  assert.deepEqual(parseHermesMaintenanceCommand('maintenance on'), {
    type: 'maintenance_toggle',
    enabled: true
  });
  assert.deepEqual(parseHermesMaintenanceCommand('Paki on maintenance mode'), {
    type: 'maintenance_toggle',
    enabled: true
  });
  assert.deepEqual(parseHermesMaintenanceCommand('On maintenance mode'), {
    type: 'maintenance_toggle',
    enabled: true
  });
  assert.deepEqual(parseHermesMaintenanceCommand('maintenance mode off'), {
    type: 'maintenance_toggle',
    enabled: false
  });
  assert.deepEqual(parseHermesScheduledReportCommand('Report ka sakin every hours'), {
    type: 'scheduled_report',
    action: 'schedule report'
  });
  assert.deepEqual(parseHermesCloudflareCheckCommand('cloudflare security check'), {
    type: 'cloudflare_check'
  });
  assert.deepEqual(parseHermesCloudflareCheckCommand('cf status'), {
    type: 'cloudflare_check'
  });
  assert.equal(parseHermesCloudflareCheckCommand('cloudflare account token'), null);
  assert.deepEqual(parseHermesIpLookupCommand('ip lookup 1.1.1.1'), {
    type: 'ip_lookup',
    ip: '1.1.1.1'
  });
  assert.deepEqual(parseHermesIpLookupCommand('check IP 8.8.8.8 country/asn'), {
    type: 'ip_lookup',
    ip: '8.8.8.8'
  });
  assert.deepEqual(parseHermesIpLookupCommand('ano country ng 165.154.51.90'), {
    type: 'ip_lookup',
    ip: '165.154.51.90'
  });
  assert.equal(parseHermesIpLookupCommand('block 165.154.51.90'), null);
  assert.deepEqual(parseHermesWebsiteBugCheckCommand('hanap bug sa website mobile blinking'), {
    type: 'website_bug_check'
  });
  assert.deepEqual(parseHermesWebsiteBugCheckCommand('check frontend bugs'), {
    type: 'website_bug_check'
  });
  assert.equal(parseHermesWebsiteBugCheckCommand('website status'), null);
});

test('Hermes pending confirmations survive memory loss', () => {
  const previousConfig = testRuntimeConfig;
  try {
    testRuntimeConfig = {};
    writeHermesPendingCommand('12345', {
      command: { type: 'maintenance_toggle', enabled: true },
      expiresAt: Date.now() + 60000,
      preparedAt: '2026-06-04T12:00:00.000Z'
    });
    pendingHermesOwnerCommands.clear();
    const recovered = readHermesPendingCommand('12345');
    assert.deepEqual(recovered.command, { type: 'maintenance_toggle', enabled: true });
    clearHermesPendingCommand('12345');
    assert.equal(readHermesPendingCommand('12345'), null);
  } finally {
    testRuntimeConfig = previousConfig;
  }
});

test('Hermes ticket and order status parsers use explicit ids', () => {
  assert.deepEqual(parseHermesTicketActionCommand('reply ticket 5: Hi, checking na.'), {
    type: 'ticket_action',
    action: 'reply',
    ticketId: '5',
    status: 'Pending',
    reply: 'Hi, checking na.'
  });
  assert.deepEqual(parseHermesOrderStatusCommand('refund order 1538356'), {
    type: 'order_status_action',
    action: 'refund',
    orderId: '1538356',
    status: 'Cancelled',
    note: 'Refund requested by owner through Hermes Telegram.'
  });
  assert.equal(parseHermesOrderStatusCommand('Meron bang suspicious ip address sa website'), null);
  assert.equal(parseHermesOrderStatusCommand('Ano ang ip nya'), null);
  assert.equal(parseHermesOrderStatusCommand('Bakit unavailable'), null);
});

test('Hermes parses user lifecycle commands as reversible status actions', () => {
  assert.deepEqual(parseHermesUserStatusCommand('delete user apexsmmm'), {
    type: 'user_status_action',
    action: 'soft_delete',
    username: 'apexsmmm'
  });
  assert.deepEqual(parseHermesUserStatusCommand('restore user apexsmmm'), {
    type: 'user_status_action',
    action: 'restore',
    username: 'apexsmmm'
  });
});

test('Hermes parses audit and rollback owner commands', () => {
  assert.deepEqual(parseHermesAuditCommand('audit recent 7'), {
    type: 'audit_recent',
    limit: 7
  });
  assert.deepEqual(parseHermesRollbackCommand('rollback last'), {
    type: 'rollback_last'
  });
  assert.deepEqual(parseHermesPromptCommand('/promt'), {
    type: 'prompt',
    action: 'show'
  });
});

test('Hermes routes security IP questions to firewall status', () => {
  assert.deepEqual(parseHermesFirewallCommand('Meron bang suspicious ip address sa website'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: 'Meron bang suspicious ip address sa website'
  });
  assert.deepEqual(parseHermesFirewallCommand('/ip address'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: '/ip address'
  });
  assert.deepEqual(parseHermesFirewallCommand('Ano ginawa ng attacker'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: 'Ano ginawa ng attacker'
  });
  assert.deepEqual(parseHermesFirewallCommand('Delikado ba ginagawa nitong ip address nato'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: 'Delikado ba ginagawa nitong ip address nato'
  });
  assert.deepEqual(parseHermesFirewallCommand('Sino bayan'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: 'Sino bayan'
  });
  assert.deepEqual(parseHermesFirewallCommand('Pwede malaman country ng suspicious IP'), {
    type: 'firewall',
    action: 'status',
    natural: true,
    text: 'Pwede malaman country ng suspicious IP'
  });
  assert.deepEqual(parseHermesFirewallCommand('Paki block ang ip na http://165.154.51.90'), {
    type: 'firewall',
    action: 'block',
    ip: '165.154.51.90'
  });
  assert.deepEqual(parseHermesFirewallCommand('block ip 192.0.2.44'), {
    type: 'firewall',
    action: 'block',
    ip: '192.0.2.44'
  });
  assert.equal(isValidHermesIp('192.0.2.44'), true);
  assert.equal(isValidHermesIp('2001:db8::1'), true);
  assert.equal(isValidHermesIp('999.999.999.999'), false);
  assert.equal(isValidHermesIp('not-an-ip'), false);
});

test('Hermes answers security follow-ups without repeating full status dumps', () => {
  const whatDoing = buildHermesNaturalFirewallStatusReply('Anoba ginagawa nya');
  assert.match(whatDoing, /nag-request siya ng GET \//);
  assert.match(whatDoing, /Hindi ko siya tatawaging confirmed attacker/);
  assert.doesNotMatch(whatDoing, /Source: config\.json firewall events/);
  assert.doesNotMatch(whatDoing, /Blocked IPs:/);

  const ddos = buildHermesNaturalFirewallStatusReply('Malalaman moba kung mag ddos sa website?');
  assert.match(ddos, /Hindi ko pa masasabing DDoS/i);
  assert.match(ddos, /DDoS needs traffic volume evidence/i);
  assert.doesNotMatch(ddos, /Threat Assessment/);
  assert.doesNotMatch(ddos, /Verified: YES/);

  const attacker = buildHermesNaturalFirewallStatusReply('Pano malalaman kung attacker ang suspicious ip');
  assert.match(attacker, /Hindi automatic na attacker agad/i);
  assert.match(attacker, /Kailangan ng evidence/i);
  assert.match(attacker, /Scanner user-agent alone/i);
  assert.doesNotMatch(attacker, /Blocked IP count:/);

  const conversationalAttacker = buildHermesConversationalSecurityReply('Pano malalaman kung attacker ang suspicious ip');
  assert.match(conversationalAttacker, /Hindi automatic na attacker agad/i);
  assert.doesNotMatch(conversationalAttacker, /May security event na naka-log for review/);
  assert.doesNotMatch(conversationalAttacker, /Blocked IP count:/);

  const report = buildHermesNaturalFirewallStatusReply('/firewall report');
  assert.match(report, /Threat Assessment/);
});

test('Hermes includes country and ASN in suspicious IP follow-ups', () => {
  const who = buildHermesNaturalFirewallStatusReply('Sino bayan');
  assert.match(who, /Latest suspicious IP: 165\.154\.51\.90/);
  assert.match(who, /Country: China/);
  assert.match(who, /ASN: AS14061 DigitalOcean LLC/);

  const country = buildHermesNaturalFirewallStatusReply('Pwede malaman country ng suspicious IP');
  assert.match(country, /Suspicious IP: 165\.154\.51\.90/);
  assert.match(country, /Country: China/);
  assert.match(country, /ASN\/Network: AS14061 DigitalOcean LLC/);
  assert.match(country, /Geo source: ipwho\.is/);
});

test('Hermes normalizes stored firewall risk and explains missing ASN', () => {
  const originalConfig = JSON.parse(JSON.stringify(testRuntimeConfig));
  try {
    testRuntimeConfig = {
      blockedIps: [],
      hermesFirewallEvents: [{
        ip: '45.142.193.215',
        type: 'app-firewall',
        country: 'NL',
        asn: 'UNAVAILABLE',
        geoSource: 'request proxy headers',
        severity: 'medium',
        riskLevel: 'MEDIUM',
        confidence: 'MEDIUM',
        reasons: ['sensitive-path-probe', 'historical-repeat-activity'],
        riskScore: 80,
        score: 80,
        count: 2,
        path: '/sftp-config.json',
        method: 'GET',
        userAgent: 'Mozilla/5.0',
        blocked: false,
        recommendedAction: 'Monitor + Rate Limit',
        createdAt: '2026-06-05T06:06:00.000Z'
      }]
    };

    const risk = buildHermesNaturalFirewallStatusReply('Ano risk sa website ngayon?');
    assert.match(risk, /Risk Score: 80\/100/);
    assert.match(risk, /Risk Level: HIGH/);
    assert.match(risk, /Evidence:/);
    assert.match(risk, /Reasoning:/);
    assert.match(risk, /Recommended Action: Monitor \+ Rate Limit/);

    const geo = buildHermesNaturalFirewallStatusReply('May suspicious IP ba? Pakita country at ASN.');
    assert.match(geo, /Country: NL/);
    assert.match(geo, /ASN\/Network: UNAVAILABLE/);
    assert.match(geo, /ASN unavailable: proxy headers provided country data only/);

    testRuntimeConfig.hermesFirewallEvents[0] = {
      ...testRuntimeConfig.hermesFirewallEvents[0],
      confidence: 'LOW',
      reasons: ['scanner-user-agent'],
      riskScore: 80,
      score: 80,
      recommendedAction: 'Monitor + Rate Limit'
    };
    const singleIndicator = buildHermesNaturalFirewallStatusReply('Ano risk sa website ngayon?');
    assert.match(singleIndicator, /Risk Score: 50\/100/);
    assert.match(singleIndicator, /Risk Level: MEDIUM/);

    testRuntimeConfig.hermesFirewallEvents[0] = {
      ...testRuntimeConfig.hermesFirewallEvents[0],
      confidence: 'LOW',
      reasons: ['scanner-user-agent', 'historical-repeat-activity'],
      indicators: [
        { id: 'scanner-user-agent', score: 18 },
        { id: 'historical-repeat-activity', score: 24 }
      ],
      riskScore: 100,
      score: 100
    };
    const staleLowConfidence = buildHermesNaturalFirewallStatusReply('Ano risk sa website ngayon?');
    assert.match(staleLowConfidence, /Risk Score: 80\/100/);
    assert.match(staleLowConfidence, /Risk Level: HIGH/);
    assert.match(staleLowConfidence, /Confidence: MEDIUM/);
  } finally {
    testRuntimeConfig = originalConfig;
  }
});

test('Hermes execution intents return exact UNAVAILABLE instead of setup checklist', () => {
  assert.equal(handleHermesExecutionIntent('Read config.json'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Read config'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('List accessible project files'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Run ls to list files'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Create hermes_test.txt'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Verify config.json exists'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Read production logs'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Check homepage HTTP status'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Check security headers for homepage'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('HTTP check https://apexsmmboosting.com'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('<invoke name="bash">echo test</invoke>'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('Run curl -I https://apexsmmboosting.com'), 'UNAVAILABLE');
  assert.equal(handleHermesExecutionIntent('HTTP_CHECK url: https://apexsmmboosting.com'), null);

  assert.equal(buildHermesLocalTelegramReply('Read config.json'), 'UNAVAILABLE');
  assert.equal(buildHermesLocalTelegramReply('List accessible project files'), 'UNAVAILABLE');
  assert.equal(buildHermesLocalTelegramReply('Create hermes_test.txt'), 'UNAVAILABLE');
  assert.equal(buildHermesLocalTelegramReply('Read production logs'), 'UNAVAILABLE');
  assert.equal(buildHermesLocalTelegramReply('Check security headers for homepage'), 'UNAVAILABLE');
  assert.match(buildHermesLocalTelegramReply('Report ka sakin every hours'), /Recurring reports/);
  assert.doesNotMatch(buildHermesLocalTelegramReply('PUBLIC_SITE_URL should be your live domain'), /Configuration checklist/);
  assert.match(buildHermesLocalTelegramReply('How do I configure PUBLIC_SITE_URL?'), /Configuration checklist/);
  assert.doesNotMatch(buildHermesLocalTelegramReply('May new order ba ngayon mga customer ko?'), /Nareceive|support team|customer/i);
  assert.equal(isLikelyCustomerSupportDraftRequest('May new order ba ngayon mga customer ko?'), false);
  assert.equal(isLikelyCustomerSupportDraftRequest('Pa cancel ng order nato\n#1561606\n#1561400'), false);
  assert.equal(isLikelyCustomerSupportDraftRequest('Gawan mo ng reply sa customer: pa refill order nya'), true);
});

test('Hermes lists blocked IPs when asked for blocked IP list', () => {
  const blocked = buildHermesNaturalFirewallStatusReply('Ano ang mga ip na naka block');
  assert.match(blocked, /Blocked IP count: 2/);
  assert.match(blocked, /77\.83\.39\.21/);
  assert.match(blocked, /195\.178\.110\.31/);
  assert.doesNotMatch(blocked, /Latest IP:/);
});

test('Hermes catches unsupported destructive user commands', () => {
  assert.deepEqual(parseHermesUnsupportedDestructiveCommand('remove user apexsmmm'), {
    type: 'unsupported_destructive',
    action: 'delete user account'
  });
});

test('Hermes data parser requires explicit arguments', () => {
  assert.deepEqual(parseHermesDataIntent('Read user record'), {
    type: 'unavailable',
    action: 'Data request',
    reason: 'UNAVAILABLE: missing required argument username'
  });
  assert.deepEqual(parseHermesDataIntent('USER_BALANCE username: apexsmmm'), {
    type: 'user_balance',
    username: 'apexsmmm'
  });
  assert.deepEqual(parseHermesDataIntent('customer info apexsmmm'), {
    type: 'user_record',
    username: 'apexsmmm'
  });
  assert.deepEqual(parseHermesDataIntent('orders ng customer apexsmmm'), {
    type: 'user_orders',
    username: 'apexsmmm'
  });
  assert.deepEqual(parseHermesDataIntent('list refill eligible orders username: apexsmmm'), {
    type: 'refill_eligible_orders',
    username: 'apexsmmm'
  });
  assert.deepEqual(parseHermesDataIntent('HTTP_CHECK url: https://apexsmmboosting.com'), {
    type: 'http_check',
    urls: ['https://apexsmmboosting.com']
  });
  assert.equal(parseHermesDataIntent('Paki on maintenance mode'), null);
  assert.equal(parseHermesDataIntent('On maintenance mode'), null);
  assert.equal(parseHermesDataIntent('Report ka sakin every hours'), null);
});

test('Hermes data parser routes natural admin data questions', () => {
  assert.equal(parseHermesOrderStatusCommand('Sino ang pinaka bagong user ng website ko'), null);
  assert.deepEqual(parseHermesDataIntent('Sino ang pinaka bagong user ng website ko'), {
    type: 'latest_user'
  });
  assert.deepEqual(parseHermesDataIntent('May nag addfunds ba?'), {
    type: 'recent_deposits'
  });
  assert.deepEqual(parseHermesDataIntent('May new order ba ngayon mga customer ko?'), {
    type: 'recent_orders'
  });
  assert.deepEqual(parseHermesDataIntent('Meron bagong ticket?'), {
    type: 'recent_tickets'
  });
  assert.deepEqual(parseHermesDataIntent('Meron ba ang submit ng ticket?'), {
    type: 'recent_tickets'
  });
});
