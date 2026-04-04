const express = require('express');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const { logWarn } = require('../utils/logger');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return `${value || ''}`.trim();
}

function validateContactPayload(body) {
  const name = normalizeString(body?.name);
  const email = normalizeString(body?.email).toLowerCase();
  const subject = normalizeString(body?.subject);
  const message = normalizeString(body?.message);
  const phone = normalizeString(body?.phone);

  if (!name || name.length < 2) {
    return { ok: false, error: { code: 'CONTACT_INVALID_NAME', message: 'Name is required.' } };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: { code: 'CONTACT_INVALID_EMAIL', message: 'Email is invalid.' } };
  }

  if (!subject || subject.length < 3) {
    return { ok: false, error: { code: 'CONTACT_INVALID_SUBJECT', message: 'Subject is required.' } };
  }

  if (!message || message.length < 10) {
    return { ok: false, error: { code: 'CONTACT_INVALID_MESSAGE', message: 'Message must contain at least 10 characters.' } };
  }

  return {
    ok: true,
    data: {
      name: name.slice(0, 120),
      email,
      subject: subject.slice(0, 160),
      message: message.slice(0, 5000),
      phone: phone.slice(0, 50),
    },
  };
}

function createContactRoutes({ emailService }) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const parsed = validateContactPayload(req.body);
    if (!parsed.ok) {
      return sendError(res, 400, parsed.error.code, parsed.error.message);
    }

    try {
      const result = await emailService.sendContactEmail({
        ...parsed.data,
        source: req.get('origin') || req.get('host') || 'website',
      });

      if (!result?.delivered) {
        return sendError(
          res,
          503,
          'CONTACT_EMAIL_NOT_CONFIGURED',
          'Contact email delivery is not configured. Please retry later.',
        );
      }

      return sendSuccess(res, 200, { delivered: true, mode: result.mode });
    } catch (error) {
      logWarn('contact_email_failed', {
        requestId: req.requestId,
        message: error?.message,
      });
      return sendError(res, 502, 'CONTACT_EMAIL_FAILED', 'Unable to send message right now. Please try again later.');
    }
  });

  return router;
}

module.exports = { createContactRoutes, validateContactPayload };
