const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { enforceCsrf } = require('../middleware/enforceCsrf');
const { requirePermission, Permissions } = require('../security/permissions');
const { validateBody } = require('../middleware/validate');
const controller = require('../controllers/media.controller');
const { validateCreateMedia } = require('../validators/media.validators');

const router = express.Router();
router.get('/', requirePermission(Permissions.MEDIA_READ), asyncHandler(controller.getMedia));
router.post('/', requirePermission(Permissions.MEDIA_UPLOAD), enforceCsrf, validateBody(validateCreateMedia), asyncHandler(controller.postMedia));
router.delete('/:id', requirePermission(Permissions.MEDIA_DELETE), enforceCsrf, asyncHandler(controller.removeMedia));
module.exports = { mediaRoutes: router };
