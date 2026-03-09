const { ok } = require('../utils/apiResponse');
const service = require('../services/events.service');
const { logAudit } = require('../services/audit.service');

async function getEvents(req, res) {
  const items = await service.listEvents(req.tenant?._id);
  return ok(res, { items });
}
async function postEvent(req, res) {
  const item = await service.createEvent({ tenantId: req.tenant?._id, userId: req.user._id, payload: req.validatedBody });
  await logAudit(req, 'event.create', 'event', item.id, { status: item.status });
  return res.status(201).json({ success: true, data: { item }, error: null, meta: {} });
}
async function patchEvent(req, res) {
  const item = await service.updateEvent({ tenantId: req.tenant?._id, userId: req.user._id, id: req.params.id, payload: req.validatedBody });
  await logAudit(req, 'event.update', 'event', item.id, req.validatedBody);
  return ok(res, { item });
}
async function removeEvent(req, res) {
  await service.deleteEvent({ tenantId: req.tenant?._id, id: req.params.id });
  await logAudit(req, 'event.delete', 'event', req.params.id);
  return res.status(204).end();
}
module.exports = { getEvents, postEvent, patchEvent, removeEvent };
