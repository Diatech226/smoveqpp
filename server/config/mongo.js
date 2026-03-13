const { AUTH_STORAGE_MODE, MONGO_URI, MONGO_DB_NAME } = require('./env');

let mongooseLib = null;
let isConnected = false;

function isMongoEnabledByMode() {
  return AUTH_STORAGE_MODE === 'mongo' || AUTH_STORAGE_MODE === 'auto';
}

async function connectMongo() {
  if (!isMongoEnabledByMode()) {
    console.warn('[mongo] AUTH_STORAGE_MODE=memory. MongoDB auth repository is disabled.');
    return false;
  }

  if (!MONGO_URI) {
    if (AUTH_STORAGE_MODE === 'mongo') {
      throw new Error('MONGO_URI is missing. Configure it to enable MongoDB-backed authentication.');
    }

    console.warn('[mongo] MONGO_URI missing: falling back to in-memory auth repository.');
    return false;
  }

  try {
    // Lazy import so memory mode does not require mongoose at runtime.
    // eslint-disable-next-line global-require
    mongooseLib = require('mongoose');
  } catch (error) {
    const message = '[mongo] Missing "mongoose" dependency. Install mongoose to enable persistent MongoDB users.';
    if (AUTH_STORAGE_MODE === 'mongo') {
      throw new Error(message);
    }

    console.warn(`${message} Falling back to in-memory auth repository.`);
    return false;
  }

  await mongooseLib.connect(MONGO_URI, {
    dbName: MONGO_DB_NAME,
    autoIndex: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production',
  });

  isConnected = true;
  console.log('[mongo] connected');
  return true;
}

async function disconnectMongo() {
  if (mongooseLib && isConnected) {
    await mongooseLib.disconnect();
    isConnected = false;
  }
}

function getMongoose() {
  return isConnected ? mongooseLib : null;
}

module.exports = { connectMongo, disconnectMongo, getMongoose, isMongoEnabledByMode };
