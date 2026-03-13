const express = require('express');
const { requireAuthenticated, requirePermission } = require('../middleware/authz');
const { Permissions } = require('../security/rbac');
const { sendSuccess, sendError } = require('../utils/apiResponse');

function createContentRoutes({ contentService }) {
  const router = express.Router();

  router.use(requireAuthenticated);

  router.get('/blog', requirePermission(Permissions.CONTENT_READ), (req, res) => {
    return sendSuccess(res, { posts: contentService.listBlogPosts() });
  });

  router.get('/analytics', requirePermission(Permissions.CONTENT_READ), (req, res) => {
    return sendSuccess(res, { analytics: contentService.getAnalytics() });
  });

  router.post('/blog', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const result = contentService.saveBlogPost(req.body);
    if (!result.ok) {
      return sendError(res, 400, result.error.code, result.error.message);
    }
    return sendSuccess(res, { post: result.post });
  });

  router.delete('/blog/:id', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    contentService.deleteBlogPost(req.params.id);
    return sendSuccess(res, { deleted: true });
  });

  router.post('/blog/:id/transition', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const { status } = req.body || {};

    if (status === 'published' && req.session?.role === 'author') {
      return sendError(res, 403, 'FORBIDDEN', 'Authors cannot publish content directly.');
    }

    const result = contentService.transitionBlogStatus(req.params.id, status);
    if (!result.ok) {
      const statusCode = result.error.code === 'BLOG_NOT_FOUND' ? 404 : 400;
      return sendError(res, statusCode, result.error.code, result.error.message);
    }

    return sendSuccess(res, { post: result.post });
  });

  return router;
}

module.exports = { createContentRoutes };
