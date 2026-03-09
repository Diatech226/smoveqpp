const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { enforceCsrf } = require('../middleware/enforceCsrf');
const { requirePermission, Permissions } = require('../security/permissions');
const { validateBody } = require('../middleware/validate');
const controller = require('../controllers/events.controller');
const { validateCreateEvent, validateUpdateEvent } = require('../validators/events.validators');

const router = express.Router();
router.get('/', requirePermission(Permissions.EVENT_READ), asyncHandler(controller.getEvents));
router.post('/', requirePermission(Permissions.EVENT_CREATE), enforceCsrf, validateBody(validateCreateEvent), asyncHandler(controller.postEvent));
router.patch('/:id', requirePermission(Permissions.EVENT_UPDATE), enforceCsrf, validateBody(validateUpdateEvent), asyncHandler(controller.patchEvent));
router.delete('/:id', requirePermission(Permissions.EVENT_DELETE), enforceCsrf, asyncHandler(controller.removeEvent));
module.exports = { eventRoutes: router };
