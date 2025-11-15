// /var/www/server/src/lib/mongo.js
const { MongoClient, ObjectId } = require('mongodb');

const USER = process.env.MDB_USER || '';
const PASS = process.env.MDB_PASS || '';
const DB_NAME = (process.env.DB_NAME || 'LargeProject').trim() || 'LargeProject';

if (!USER || !PASS) {
  throw new Error('DB env not set (MDB_USER/MDB_PASS)');
}

const uri =
  `mongodb+srv://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}` +
  `@simplesite.s1xesvx.mongodb.net/?retryWrites=true&w=majority&authSource=admin&appName=SimpleSite`;

let _client = null;
let _db = null;

async function connectDb() {
  if (_db) return _db;
  _client = new MongoClient(uri /*, { serverApi: '1' } */);
  await _client.connect();
  _db = _client.db(DB_NAME);
  return _db;
}

// Synchronous getter used by routes AFTER ensureIndexes() has run.
function getDb() {
  if (!_db) throw new Error('DB not initialized. Call ensureIndexes() before handling requests.');
  return _db;
}

// Convenience: collection by name (sync after init)
function col(name) {
  return getDb().collection(name);
}

// Helper: safe ObjectId parse (used by routes)
function oid(v) {
  try { return new ObjectId(String(v)); } catch { return null; }
}

async function ensureIndexes() {
  const db = await connectDb();

  // Users: unique login
  try { await db.collection('Users').createIndex({ login: 1 }, { unique: true }); } catch {}

  // Transactions: common filters
  try {
    await db.collection('Transactions').createIndex({ userId: 1, date: -1 });
    await db.collection('Transactions').createIndex({ userId: 1, budgetId: 1, date: -1 });
    await db.collection('Transactions').createIndex({ userId: 1, category: 1, date: -1 });
  } catch {}

  // Budgets
  try {
    await db.collection('Budgets').createIndex({ userId: 1, period: 1, updatedAt: -1 });
    await db.collection('Budgets').createIndex({ userId: 1, name: 1 });
  } catch {}

  // Email verification + Password reset tokens
  try {
    await db.collection('EmailVerification').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('EmailVerification').createIndex({ token: 1 }, { unique: true });
  } catch {}
  try {
    await db.collection('PasswordReset').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('PasswordReset').createIndex({ token: 1 }, { unique: true });
  } catch {}

  console.log('DB connected & indexes ensured');
}

// Optional: graceful shutdown
function setupShutdown() {
  const close = async () => {
    try { await _client?.close(); } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}

module.exports = { ensureIndexes, getDb, col, oid, setupShutdown };
