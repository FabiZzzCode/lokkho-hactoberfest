import { MongoClient } from 'mongodb';
import { AppError } from '../errors.js';

// One client per warm serverless instance; indexes are created once per instance.
async function connect() {
  const { MONGODB_URI, MONGODB_DB = 'lokkho' } = process.env;
  if (!MONGODB_URI) throw new AppError('unavailable', 'The database is not set up on this server.', 503);
  const db = (await new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).connect()).db(MONGODB_DB);
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('profiles').createIndex({ userId: 1 }, { unique: true }),
    db.collection('attempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return db;
}
export function getDb() {
  globalThis.__lokkhoDb ??= connect();
  return globalThis.__lokkhoDb.catch((e) => {
    globalThis.__lokkhoDb = undefined;
    throw e instanceof AppError ? e : new AppError('unavailable', 'Could not reach the database.', 503);
  });
}
