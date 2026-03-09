const mongoose = require('mongoose');
function getUserModel() { return mongoose.model('User'); }
function listUsers({ tenantId, query = '', role, status, limit, offset }) {
  const filters = { tenantId };
  if (role) filters.role = role;
  if (status) filters.status = status;
  if (query) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filters.$or = [{ name: regex }, { email: regex }];
  }
  return Promise.all([getUserModel().find(filters).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(), getUserModel().countDocuments(filters)]);
}
function findByEmail(tenantId, email) { return getUserModel().findOne({ tenantId, email: email.toLowerCase() }); }
function createUser(payload) { return getUserModel().create(payload); }
function findUserById(tenantId, userId) { return getUserModel().findOne({ _id: userId, tenantId }); }
module.exports = { listUsers, findByEmail, createUser, findUserById };
