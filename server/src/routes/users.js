// /var/www/server/src/routes/users.js
const express = require('express');
const router = express.Router();
const { col } = require('../lib/mongo');

// Try to import an oid helper; fall back to ObjectId
let oid = null;
try { ({ oid } = require('../lib/mongo')); } catch (_) {}
const { ObjectId } = require('mongodb');
if (!oid) oid = (v) => { try { return new ObjectId(String(v)); } catch { return null; } };

const findProjection = {
  firstName: 1, lastName: 1, login: 1, isVerified: 1,
  createdAt: 1, verifiedAt: 1, updatedAt: 1
};

function pickIdentity(req) {
  // 1) Header: X-User-Id: <mongoId>
  const h = req.headers['x-user-id'];
  if (h) { const o = oid(h); if (!o) throw new Error('Invalid X-User-Id'); return { _id: o }; }

  // 2) Query/body id: ?id=<mongoId> or { "id": ... }
  if (req.query.id) { const o = oid(req.query.id); if (!o) throw new Error('Invalid id'); return { _id: o }; }
  if (req.body?.id) { const o = oid(req.body.id); if (!o) throw new Error('Invalid id'); return { _id: o }; }

  // 3) Query/body login (email)
  const login = String((req.query.login || req.body?.login || '')).trim().toLowerCase();
  if (login) return { login };

  throw new Error('Provide X-User-Id header, id, or login');
}

function toPublic(u) {
  if (!u) return u;
  const out = {
    _id: String(u._id),
    firstName: u.firstName,
    lastName: u.lastName,
    login: u.login,
    isVerified: !!u.isVerified,
  };
  if (u.createdAt)  out.createdAt  = new Date(u.createdAt).toISOString();
  if (u.verifiedAt) out.verifiedAt = new Date(u.verifiedAt).toISOString();
  if (u.updatedAt)  out.updatedAt  = new Date(u.updatedAt).toISOString();
  return out;
}

// GET /api/users  (identify by X-User-Id OR ?id= OR ?login=)
router.get('/', async (req, res) => {
  try {
    const who = pickIdentity(req);
    const Users = await col('Users');
    const user = await Users.findOne(who, { projection: findProjection });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ item: toPublic(user), error: '' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/users  (same identity rules). Only firstName/lastName allowed here.
router.patch('/', async (req, res) => {
  try {
    const who = pickIdentity(req);
    const inb = req.body || {};
    const $set = {};

    if ('firstName' in inb) {
      const v = String(inb.firstName || '').trim();
      if (!v) return res.status(400).json({ error: 'firstName cannot be empty' });
      $set.firstName = v;
    }
    if ('lastName' in inb) {
      const v = String(inb.lastName || '').trim();
      if (!v) return res.status(400).json({ error: 'lastName cannot be empty' });
      $set.lastName = v;
    }

    // Block sensitive fields here (email change handled elsewhere to re-verify)
    for (const bad of ['password', 'passwordHash', 'isVerified', 'login']) {
      if (bad in inb) return res.status(400).json({ error: `Field '${bad}' cannot be updated here` });
    }

    if (!Object.keys($set).length) return res.status(400).json({ error: 'No fields to update' });
    $set.updatedAt = new Date();

    const Users = await col('Users');
    const r = await Users.updateOne(who, { $set });
    if (r.matchedCount === 0) return res.status(404).json({ error: 'User not found' });

    const user = await Users.findOne(who, { projection: findProjection });
    res.json({ item: toPublic(user), error: '' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
