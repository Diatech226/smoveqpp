const { Event } = require('../models/Event');

function toResponse(item) {
  return { ...item.toObject(), id: String(item._id), _id: String(item._id) };
}

async function listEvents(tenantId) {
  return Event.find({ tenantId }).sort({ startsAt: 1, updatedAt: -1 });
}

async function createEvent({ tenantId, userId, payload }) {
  const exists = await Event.exists({ tenantId, slug: payload.slug });
  if (exists) {
    const err = new Error('Event slug already exists'); err.status = 409; err.code = 'CONFLICT'; throw err;
  }
  const item = await Event.create({ ...payload, tenantId, createdBy: userId, updatedBy: userId });
  return toResponse(item);
}

async function updateEvent({ tenantId, userId, id, payload }) {
  const item = await Event.findOne({ _id: id, tenantId });
  if (!item) { const err = new Error('Event not found'); err.status = 404; err.code = 'NOT_FOUND'; throw err; }
  if (payload.slug && payload.slug !== item.slug) {
    const exists = await Event.exists({ tenantId, slug: payload.slug, _id: { $ne: id } });
    if (exists) { const err = new Error('Event slug already exists'); err.status = 409; err.code = 'CONFLICT'; throw err; }
  }
  Object.assign(item, payload, { updatedBy: userId });
  await item.save();
  return toResponse(item);
}

async function deleteEvent({ tenantId, id }) {
  const item = await Event.findOneAndDelete({ _id: id, tenantId });
  if (!item) { const err = new Error('Event not found'); err.status = 404; err.code = 'NOT_FOUND'; throw err; }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
