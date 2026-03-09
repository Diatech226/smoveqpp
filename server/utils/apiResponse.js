function ok(res, data = {}, meta = {}) {
  return res.json({
    success: true,
    data,
    error: null,
    meta,
  });
}

function fail(res, status, code, message, details) {
  const payload = {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
}

module.exports = { ok, fail };
