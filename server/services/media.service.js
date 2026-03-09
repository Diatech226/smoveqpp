const { Media } = require('../models/Media');
const { saveLocalFile, deleteLocalFile } = require('./mediaStorage.service');

function toResponse(item) {
  return { ...item.toObject(), id: String(item._id), _id: String(item._id) };
}

async function listMedia(tenantId, q) {
  const query = { tenantId };
  if (q) query.originalName = { $regex: q, $options: 'i' };
  const items = await Media.find(query).sort({ createdAt: -1 });
  return items.map(toResponse);
}

async function createMedia({ tenantId, userId, payload }) {
  const stored = await saveLocalFile({ buffer: payload.buffer, originalName: payload.originalName });
  const item = await Media.create({
    tenantId,
    filename: stored.filename,
    originalName: payload.originalName,
    mimeType: payload.mimeType,
    size: payload.buffer.byteLength,
    url: stored.url,
    alt: payload.alt,
    folder: payload.folder,
    uploadedBy: userId,
    storageProvider: stored.storageProvider,
  });
  return toResponse(item);
}

async function deleteMedia({ tenantId, id }) {
  const item = await Media.findOneAndDelete({ _id: id, tenantId });
  if (!item) { const err = new Error('Media not found'); err.status = 404; err.code = 'NOT_FOUND'; throw err; }
  await deleteLocalFile(item.filename);
}

module.exports = { listMedia, createMedia, deleteMedia };
