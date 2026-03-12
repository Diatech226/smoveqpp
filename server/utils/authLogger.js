function getSafeIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

function logAuthEvent(req, event, outcome, meta = {}) {
  const payload = {
    event,
    outcome,
    ip: getSafeIp(req),
    method: req.method,
    path: req.originalUrl,
    userId: req.session?.userId ?? null,
    ...meta,
  };

  const line = `[auth] ${JSON.stringify(payload)}`;
  if (outcome === 'failure') {
    console.warn(line);
    return;
  }
  console.info(line);
}

module.exports = { logAuthEvent };
