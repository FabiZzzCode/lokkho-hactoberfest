import { ObjectId } from 'mongodb';
import { getDb } from './mongo.js';

const col = async (name) => (await getDb()).collection(name);
const oid = (id) => { try { return new ObjectId(id); } catch { return null; } };

// The handlers only see these small interfaces, so tests can swap in memory stores.
export const mongoStores = {
  users: {
    async create({ email, passwordHash, displayName }) {
      const doc = { email, passwordHash, ...(displayName && { displayName }), createdAt: new Date() };
      const r = await (await col('users')).insertOne(doc);
      return { id: String(r.insertedId), email, displayName };
    },
    async findByEmail(email) {
      const u = await (await col('users')).findOne({ email });
      return u && { id: String(u._id), email: u.email, displayName: u.displayName, passwordHash: u.passwordHash };
    },
    async findById(id) {
      const _id = oid(id);
      const u = _id && await (await col('users')).findOne({ _id });
      return u && { id: String(u._id), email: u.email, displayName: u.displayName };
    },
    async remove(id) { await (await col('users')).deleteOne({ _id: oid(id) }); },
  },
  profiles: {
    async get(userId) { return (await (await col('profiles')).findOne({ userId }))?.profile ?? null; },
    async put(userId, profile) {
      await (await col('profiles')).updateOne({ userId }, { $set: { profile, version: profile.version, updatedAt: new Date() } }, { upsert: true });
    },
    async remove(userId) { await (await col('profiles')).deleteOne({ userId }); },
  },
  attempts: {
    async hit(key, windowMs) {
      const r = await (await col('attempts')).findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) } },
        { upsert: true, returnDocument: 'after' },
      );
      return (r?.value ?? r).count;
    },
  },
};
