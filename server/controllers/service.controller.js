const { ok } = require('../utils/apiResponse');
const serviceService = require('../services/service.service');

async function getServices(req, res) {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10), 1), 100);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const result = await serviceService.listServices({
    tenantId: req.tenant?._id,
    page,
    limit,
    status,
  });

  return ok(res, { items: result.items }, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}

async function postService(req, res) {
  const item = await serviceService.createService({
    tenantId: req.tenant?._id,
    userId: req.user._id,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    data: { item },
    error: null,
    meta: {},
  });
}

async function patchService(req, res) {
  const item = await serviceService.updateService({
    tenantId: req.tenant?._id,
    userId: req.user._id,
    serviceId: req.params.id,
    payload: req.body,
  });

  return ok(res, { item }, {});
}

module.exports = {
  getServices,
  postService,
  patchService,
};
