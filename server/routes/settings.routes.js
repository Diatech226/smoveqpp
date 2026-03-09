const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { enforceCsrf } = require('../middleware/enforceCsrf');
const { requirePermission, Permissions } = require('../security/permissions');
const { validateBody } = require('../middleware/validate');
const controller = require('../controllers/settings.controller');
const { validatePatchSettings } = require('../validators/settings.validators');

const router = express.Router();
router.get('/', requirePermission(Permissions.SETTINGS_READ), asyncHandler(controller.getSettings));
router.patch('/', requirePermission(Permissions.SETTINGS_UPDATE), enforceCsrf, validateBody(validatePatchSettings), asyncHandler(controller.patchSettings));
module.exports = { settingsRoutes: router };
