const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { enforceCsrf } = require('../middleware/enforceCsrf');
const { requirePermission, Permissions } = require('../security/permissions');
const serviceController = require('../controllers/service.controller');

const router = express.Router();

router.get('/', requirePermission(Permissions.SERVICE_READ), asyncHandler(serviceController.getServices));
router.post('/', requirePermission(Permissions.SERVICE_CREATE), enforceCsrf, asyncHandler(serviceController.postService));
router.patch('/:id', requirePermission(Permissions.SERVICE_UPDATE), enforceCsrf, asyncHandler(serviceController.patchService));

module.exports = { serviceRoutes: router };
