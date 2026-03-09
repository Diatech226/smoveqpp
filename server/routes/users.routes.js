const express = require('express');
const { ok, fail } = require('../utils/apiResponse');
const { getUsers, inviteUser, updateUserRole, updateUserStatus } = require('../services/users.service');

function usersRoutes({ requireAdmin, logAudit }) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    const data = await getUsers({ tenantId: req.tenant?._id, query: req.query });
    return ok(res, data, { pagination: data.pagination });
  });

  router.post('/invite', async (req, res) => {
    try {
      const invited = await inviteUser({ tenantId: req.tenant?._id, actor: req.user, payload: req.body ?? {} });
      await logAudit(req, 'user.invite', 'user', invited.id, { role: invited.role });
      return ok(res, invited);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVITE_FAILED';
      if (code === 'USER_EXISTS') return fail(res, 409, code, 'User already exists for this tenant');
      if (code.endsWith('_INVALID')) return fail(res, 400, code, 'Invalid invite payload');
      return fail(res, 500, 'INVITE_FAILED', 'Unable to invite user');
    }
  });

  router.patch('/:id/role', async (req, res) => {
    try {
      const updated = await updateUserRole({ tenantId: req.tenant?._id, userId: req.params.id, role: req.body?.role });
      await logAudit(req, 'user.role.update', 'user', updated.id, { role: updated.role });
      return ok(res, updated);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UPDATE_FAILED';
      if (code === 'USER_NOT_FOUND') return fail(res, 404, code, 'User not found');
      if (code === 'ROLE_INVALID') return fail(res, 400, code, 'Invalid role');
      return fail(res, 500, 'UPDATE_FAILED', 'Unable to update role');
    }
  });

  router.patch('/:id/status', async (req, res) => {
    try {
      const updated = await updateUserStatus({ tenantId: req.tenant?._id, userId: req.params.id, status: req.body?.status });
      await logAudit(req, 'user.status.update', 'user', updated.id, { status: updated.status });
      return ok(res, updated);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UPDATE_FAILED';
      if (code === 'USER_NOT_FOUND') return fail(res, 404, code, 'User not found');
      if (code === 'STATUS_INVALID') return fail(res, 400, code, 'Invalid status');
      return fail(res, 500, 'UPDATE_FAILED', 'Unable to update status');
    }
  });

  return router;
}

module.exports = { usersRoutes };
