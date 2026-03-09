const { Service, SERVICE_STATUSES } = require('../models/Service');

function normalizeSlug(input = '') {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function toServiceResponse(service) {
  return {
    id: String(service._id),
    tenantId: service.tenantId ? String(service.tenantId) : null,
    title: service.title,
    slug: service.slug,
    description: service.description,
    status: service.status,
    createdBy: String(service.createdBy),
    updatedBy: String(service.updatedBy),
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function parseServicePayload(payload = {}, { isUpdate = false } = {}) {
  const errors = [];
  const parsed = {};

  if (!isUpdate || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length < 3) {
      errors.push('title must be at least 3 characters');
    } else {
      parsed.title = payload.title.trim();
    }
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string') errors.push('description must be a string');
    else parsed.description = payload.description.trim();
  }

  if (payload.status !== undefined) {
    if (!SERVICE_STATUSES.includes(payload.status)) errors.push('status must be draft or published');
    else parsed.status = payload.status;
  }

  if (payload.slug !== undefined) {
    if (typeof payload.slug !== 'string') errors.push('slug must be a string');
    else parsed.slug = normalizeSlug(payload.slug);
  }

  if (!parsed.slug && parsed.title) parsed.slug = normalizeSlug(parsed.title);
  if (!isUpdate && !parsed.slug) errors.push('slug is required');

  return { parsed: errors.length ? null : parsed, errors };
}

async function listServices({ tenantId, page, limit, status }) {
  const query = { tenantId };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Service.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Service.countDocuments(query),
  ]);

  return {
    items: items.map(toServiceResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function createService({ tenantId, userId, payload }) {
  const { parsed, errors } = parseServicePayload(payload);
  if (errors.length) {
    const err = new Error('Validation failed');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = errors;
    throw err;
  }

  const exists = await Service.exists({ tenantId, slug: parsed.slug });
  if (exists) {
    const err = new Error('Service slug already exists');
    err.status = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  const service = await Service.create({
    ...parsed,
    tenantId,
    createdBy: userId,
    updatedBy: userId,
  });

  return toServiceResponse(service);
}

async function updateService({ tenantId, userId, serviceId, payload }) {
  const service = await Service.findOne({ _id: serviceId, tenantId });
  if (!service) {
    const err = new Error('Service not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const { parsed, errors } = parseServicePayload(payload, { isUpdate: true });
  if (errors.length) {
    const err = new Error('Validation failed');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = errors;
    throw err;
  }

  if (parsed.slug && parsed.slug !== service.slug) {
    const exists = await Service.exists({ tenantId, slug: parsed.slug, _id: { $ne: serviceId } });
    if (exists) {
      const err = new Error('Service slug already exists');
      err.status = 409;
      err.code = 'CONFLICT';
      throw err;
    }
  }

  Object.assign(service, parsed, { updatedBy: userId });
  await service.save();

  return toServiceResponse(service);
}

module.exports = {
  listServices,
  createService,
  updateService,
};
