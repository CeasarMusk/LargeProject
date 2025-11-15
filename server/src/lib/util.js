// /var/www/server/src/lib/util.js
const { oid } = require('./mongo');

function now() { return new Date(); }
function toIso(d) { return d ? new Date(d).toISOString() : null; }

function parseDateMaybe(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error('Invalid date format: ' + v);
  return d;
}

function requireUserIdFromAny(req) {
  // body.userId > query.userId > X-User-Id header
  const b = req.body || {};
  const idStr = b.userId || req.query.userId || req.headers['x-user-id'];
  const id = oid(idStr);
  if (!id) throw new Error('Missing or invalid userId');
  return id;
}

module.exports = { now, toIso, parseDateMaybe, requireUserIdFromAny };

