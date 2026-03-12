function sendSuccess(res, status, data = {}) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

function sendError(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = { sendSuccess, sendError };
