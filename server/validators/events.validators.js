const { createValidator, normalizeSlug } = require('./common');
const { EVENT_STATUSES } = require('../models/Event');

const validateCreateEvent = createValidator((payload, errors) => {
  const value = {};
  if (typeof payload.title !== 'string' || payload.title.trim().length < 3) errors.push('title must be at least 3 characters');
  else value.title = payload.title.trim();

  value.slug = normalizeSlug(payload.slug || payload.title, 200);
  if (!value.slug || value.slug.length < 3) errors.push('slug is invalid');

  if (typeof payload.startsAt !== 'string' || Number.isNaN(Date.parse(payload.startsAt))) errors.push('startsAt must be an ISO date');
  else value.startsAt = new Date(payload.startsAt);

  if (payload.endsAt !== undefined && payload.endsAt !== null) {
    if (typeof payload.endsAt !== 'string' || Number.isNaN(Date.parse(payload.endsAt))) errors.push('endsAt must be an ISO date');
    else value.endsAt = new Date(payload.endsAt);
  }

  value.description = typeof payload.description === 'string' ? payload.description.trim() : '';
  value.location = typeof payload.location === 'string' ? payload.location.trim() : '';
  if (payload.status !== undefined && !EVENT_STATUSES.includes(payload.status)) errors.push('invalid status');
  value.status = EVENT_STATUSES.includes(payload.status) ? payload.status : 'draft';
  return value;
});

const validateUpdateEvent = createValidator((payload, errors) => {
  const value = {};
  if (payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length < 3) errors.push('title must be at least 3 characters');
    else value.title = payload.title.trim();
  }
  if (payload.slug !== undefined) {
    value.slug = normalizeSlug(payload.slug, 200);
    if (!value.slug || value.slug.length < 3) errors.push('slug is invalid');
  }
  if (payload.startsAt !== undefined) {
    if (typeof payload.startsAt !== 'string' || Number.isNaN(Date.parse(payload.startsAt))) errors.push('startsAt must be an ISO date');
    else value.startsAt = new Date(payload.startsAt);
  }
  if (payload.endsAt !== undefined) {
    if (payload.endsAt !== null && (typeof payload.endsAt !== 'string' || Number.isNaN(Date.parse(payload.endsAt)))) errors.push('endsAt must be an ISO date or null');
    else value.endsAt = payload.endsAt ? new Date(payload.endsAt) : null;
  }
  if (payload.status !== undefined) {
    if (!EVENT_STATUSES.includes(payload.status)) errors.push('invalid status');
    else value.status = payload.status;
  }
  if (payload.description !== undefined) value.description = String(payload.description ?? '').trim();
  if (payload.location !== undefined) value.location = String(payload.location ?? '').trim();
  return value;
});

module.exports = { validateCreateEvent, validateUpdateEvent };
