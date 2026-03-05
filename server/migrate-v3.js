const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/smove';

async function run() {
  await mongoose.connect(MONGO_URI);
  const posts = mongoose.connection.collection('posts');

  const statusFix = await posts.updateMany(
    { $or: [{ status: null }, { status: { $exists: false } }] },
    { $set: { status: 'published' } },
  );

  const removedFix = await posts.updateMany(
    { deletedAt: { $exists: true, $ne: null } },
    { $set: { status: 'removed' }, $unset: { deletedAt: '' } },
  );

  await posts.createIndex({ slug: 1 }, { unique: true, background: true });
  await posts.createIndex({ status: 1 }, { background: true });
  await posts.createIndex({ publishedAt: -1 }, { background: true });
  await posts.createIndex({ category: 1 }, { background: true });

  console.log('V3 migration complete', {
    statusFix: statusFix.modifiedCount,
    removedFix: removedFix.modifiedCount,
  });

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('V3 migration failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
