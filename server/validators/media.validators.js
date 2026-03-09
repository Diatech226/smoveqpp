const { createValidator } = require('./common');

const MAX_UPLOAD_BYTES = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024);

const validateCreateMedia = createValidator((payload, errors) => {
  const value = {};
  if (typeof payload.originalName !== 'string' || payload.originalName.trim().length < 1) errors.push('originalName is required');
  else value.originalName = payload.originalName.trim();

  if (typeof payload.mimeType !== 'string' || payload.mimeType.trim().length < 3) errors.push('mimeType is required');
  else value.mimeType = payload.mimeType.trim();

  if (typeof payload.data !== 'string' || payload.data.trim().length < 20) errors.push('data must be a base64 payload');
  else value.data = payload.data;

  value.alt = typeof payload.alt === 'string' ? payload.alt.trim() : '';
  value.folder = typeof payload.folder === 'string' ? payload.folder.trim() : '';

  try {
    value.buffer = Buffer.from((value.data || '').split(',').pop(), 'base64');
  } catch (_error) {
    errors.push('invalid base64 data');
  }

  if (value.buffer && value.buffer.byteLength > MAX_UPLOAD_BYTES) errors.push(`file size exceeds limit (${MAX_UPLOAD_BYTES} bytes)`);

  return value;
});

module.exports = { validateCreateMedia, MAX_UPLOAD_BYTES };
