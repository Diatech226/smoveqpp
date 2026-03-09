const express = require('express');
const { ok } = require('../utils/apiResponse');
const { getAdminAnalytics } = require('../services/analytics.service');

function analyticsRoutes({ requireAdmin }) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/overview', async (req, res) => {
    const metrics = await getAdminAnalytics({ tenantId: req.tenant?._id });
    return ok(res, metrics);
  });

  return router;
}

module.exports = { analyticsRoutes };
