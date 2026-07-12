import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let memoryServer = null;

export async function connectDb() {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.isProduction ? 10000 : 3000,
    });
    return mongoose.connection;
  } catch (err) {
    if (env.isProduction) throw err;

    // Dev fallback: no MongoDB reachable — start an in-memory replica set
    // (replica set required because settlements use multi-document transactions).
    logger.warn(
      `Could not reach ${env.mongoUri} (${err.message}). Starting in-memory MongoDB for development.`
    );
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(memoryServer.getUri('expensio'));
    logger.info('In-memory MongoDB started (data resets on restart)');
    return mongoose.connection;
  }
}

export async function closeDb() {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
