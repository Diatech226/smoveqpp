const { AUTH_STORAGE_MODE, MONGO_URI, MONGO_DB_NAME } = require('./env');

let mongooseLib = null;
let isConnected = false;
let connectionState = {
  connected: false,
  reason: 'not_started',
};

function isMongoEnabledByMode() {
  return AUTH_STORAGE_MODE === 'mongo' || AUTH_STORAGE_MODE === 'auto';
}

async function connectMongo() {
  if (!isMongoEnabledByMode()) {
    connectionState = { connected: false, reason: 'auth_storage_mode_memory' };
    return connectionState;
  }

  if (!MONGO_URI) {
    if (AUTH_STORAGE_MODE === 'mongo') {
      throw new Error('MONGO_URI is missing. Configure it to enable MongoDB-backed authentication.');
    }

    connectionState = { connected: false, reason: 'mongo_uri_missing' };
    return connectionState;
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

    connectionState = { connected: false, reason: 'mongoose_dependency_missing' };
    return connectionState;
  }

  await mongooseLib.connect(MONGO_URI, {
    dbName: MONGO_DB_NAME,
    autoIndex: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production',
  });

  isConnected = true;
  connectionState = { connected: true, reason: 'connected' };
  return connectionState;
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

function getMongoConnectionState() {
  return { ...connectionState };
}

module.exports = { connectMongo, disconnectMongo, getMongoose, getMongoConnectionState, isMongoEnabledByMode };
