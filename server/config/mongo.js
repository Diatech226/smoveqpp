const { MONGO_URI } = require('./env');

async function connectMongo() {
  if (!MONGO_URI) {
    console.warn('[mongo] MONGO_URI missing: running with in-memory auth repository.');
    return;
  }

  console.warn('[mongo] Mongo driver not installed in this environment. Configure mongodb/mongoose dependency to enable persistent users.');
}

async function disconnectMongo() {
  return Promise.resolve();
}

module.exports = { connectMongo, disconnectMongo };
