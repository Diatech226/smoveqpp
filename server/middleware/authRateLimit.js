function createAuthRateLimiter({ windowMs, max }) {
  const buckets = new Map();

  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const current = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };

    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    if (current.count > max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again later.' },
      });
    }

    return next();
  };
}

module.exports = { createAuthRateLimiter };
