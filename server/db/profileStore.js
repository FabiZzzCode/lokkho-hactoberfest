import { createHash } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { AppError } from '../errors.js';

// Only the SHA-256 hash of the profile code is stored, never the code itself.
export const hashCode = (code) => createHash('sha256').update(code).digest('hex');

// Cache the client on globalThis so warm serverless calls reuse one connection.
function collection() {
  const { MONGODB_URI, MONGODB_DB = 'lokkho' } = process.env;
  if (!MONGODB_URI) throw new AppError('sync_unavailable', 'Cloud sync is not set up on this server.', 503);
  globalThis.__lokkhoMongo ??= new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).connect();
  return globalThis.__lokkhoMongo
    .then((c) => c.db(MONGODB_DB).collection('profiles'))
    .catch(() => { globalThis.__lokkhoMongo = undefined; throw new AppError('sync_unavailable', 'Could not reach the cloud database.', 503); });
}

// Same shape as an in-memory store, so the handler can be tested without MongoDB.
export const mongoStore = {
  async get(id) { return (await (await collection()).findOne({ _id: id }))?.profile ?? null; },
  async put(id, profile) { await (await collection()).updateOne({ _id: id }, { $set: { profile, updatedAt: new Date() } }, { upsert: true }); },
  async remove(id) { await (await collection()).deleteOne({ _id: id }); },
};
