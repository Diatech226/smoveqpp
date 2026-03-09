const { fail } = require('../utils/apiResponse');

function errorHandler(err, _req, res, _next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const code = err?.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = err?.message || 'Unexpected server error';

  if (status >= 500) {
    console.error({ err }, 'unhandled-request-error');
  }

  return fail(res, status, code, message, err?.details);
}

module.exports = { errorHandler };
