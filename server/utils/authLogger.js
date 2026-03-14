const MAX_AUDIT_EVENTS = 400;
const authAuditEvents = [];

function getSafeIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

function sanitizeMeta(meta = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(meta)) {
    if (/password|token|secret|cookie|authorization/i.test(key)) {
      continue;
    }
    if (/email/i.test(key) && typeof value === 'string') {
      safe[key] = '[redacted-email]';
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

function logAuthEvent(req, event, outcome, meta = {}) {
  const payload = {
    at: new Date().toISOString(),
    event,
    outcome,
    ip: getSafeIp(req),
    method: req.method,
    path: req.originalUrl,
    userId: req.session?.userId ?? null,
    ...sanitizeMeta(meta),
  };

  authAuditEvents.push(payload);
  if (authAuditEvents.length > MAX_AUDIT_EVENTS) {
    authAuditEvents.splice(0, authAuditEvents.length - MAX_AUDIT_EVENTS);
  }

  const line = `[auth] ${JSON.stringify(payload)}`;
  if (outcome === 'failure') {
    console.warn(line);
    return;
  }
  console.info(line);
}

function listAuthAuditEvents({ limit = 100 } = {}) {
  const normalizedLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  return authAuditEvents.slice(-normalizedLimit).reverse();
}

module.exports = { logAuthEvent, sanitizeMeta, listAuthAuditEvents };
