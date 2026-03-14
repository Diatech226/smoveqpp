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

  router.get('/projects', requirePermission(Permissions.CONTENT_READ), (req, res) =>
    sendSuccess(res, { projects: contentService.listProjects() }));

  router.post('/projects', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const result = contentService.saveProject(req.body);
    if (!result.ok) {
      return sendError(res, 400, result.error.code, result.error.message);
    }
    return sendSuccess(res, { project: result.project });
  });

  router.delete('/projects/:id', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    contentService.deleteProject(req.params.id);
    return sendSuccess(res, { deleted: true });
  });

  router.get('/media', requirePermission(Permissions.CONTENT_READ), (req, res) =>
    sendSuccess(res, { mediaFiles: contentService.listMediaFiles() }));

  router.post('/media', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const result = contentService.saveMediaFile(req.body);
    if (!result.ok) {
      return sendError(res, 400, result.error.code, result.error.message);
    }
    return sendSuccess(res, { mediaFile: result.mediaFile });
  });

  router.delete('/media/:id', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    contentService.deleteMediaFile(req.params.id);
    return sendSuccess(res, { deleted: true });
  });

  router.get('/page-content', requirePermission(Permissions.CONTENT_READ), (req, res) =>
    sendSuccess(res, { pageContent: contentService.getPageContent() }));

  router.post('/page-content', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const result = contentService.savePageContent(req.body);
    if (!result.ok) {
      return sendError(res, 400, result.error.code, result.error.message);
    }
    return sendSuccess(res, { pageContent: result.pageContent });
  });

  router.get('/settings', requirePermission(Permissions.CONTENT_READ), (req, res) =>
    sendSuccess(res, { settings: contentService.getSettings() }));

  router.post('/settings', requirePermission(Permissions.CONTENT_WRITE), (req, res) => {
    const result = contentService.saveSettings(req.body);
    if (!result.ok) {
      return sendError(res, 400, result.error.code, result.error.message);
    }
    return sendSuccess(res, { settings: result.settings });
  });

  return router;
}

module.exports = { createContentRoutes };
