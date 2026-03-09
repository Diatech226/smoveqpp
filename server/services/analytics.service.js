const mongoose = require('mongoose');

async function getAdminAnalytics({ tenantId }) {
  const Post = mongoose.model('Post');
  const Media = mongoose.models.Media;
  const Job = mongoose.model('Job');
  const postFilter = tenantId ? { tenantId } : {};
  const [published, drafts, scheduled, failedJobs, uploads] = await Promise.all([
    Post.countDocuments({ ...postFilter, status: 'published' }),
    Post.countDocuments({ ...postFilter, status: 'draft' }),
    Post.countDocuments({ ...postFilter, status: 'scheduled' }),
    Job.countDocuments({ ...postFilter, status: 'failed' }),
    Media ? Media.countDocuments({ ...postFilter }) : Promise.resolve(0),
  ]);
  return { published, drafts, scheduled, uploads, failedJobs };
}

module.exports = { getAdminAnalytics };
