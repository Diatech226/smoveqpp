const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { enforceCsrf } = require('../middleware/enforceCsrf');
const { requirePermission, Permissions } = require('../security/permissions');
const { validateBody } = require('../middleware/validate');
const controller = require('../controllers/taxonomies.controller');
const { validateCreateTaxonomy, validateUpdateTaxonomy } = require('../validators/taxonomies.validators');

const router = express.Router();
router.get('/', requirePermission(Permissions.TAXONOMY_READ), asyncHandler(controller.getTaxonomies));
router.post('/', requirePermission(Permissions.TAXONOMY_CREATE), enforceCsrf, validateBody(validateCreateTaxonomy), asyncHandler(controller.postTaxonomy));
router.patch('/:id', requirePermission(Permissions.TAXONOMY_UPDATE), enforceCsrf, validateBody(validateUpdateTaxonomy), asyncHandler(controller.patchTaxonomy));
router.delete('/:id', requirePermission(Permissions.TAXONOMY_DELETE), enforceCsrf, asyncHandler(controller.removeTaxonomy));
module.exports = { taxonomyRoutes: router };
