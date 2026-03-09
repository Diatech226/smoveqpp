const { fail } = require('../utils/apiResponse');

function enforceCsrf(req, res, next) {
  const token = req.get('X-CSRF-Token');
  if (!token || token !== req.session.csrfToken) {
    return fail(res, 403, 'INVALID_CSRF', 'Invalid CSRF token');
  }
  return next();
}

module.exports = { enforceCsrf };
