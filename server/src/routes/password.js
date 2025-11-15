// /var/www/server/src/routes/password.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { col, oid } = require('../lib/mongo');
const { sendMail } = require('../lib/sendgrid');

function ok(res, body) { return res.json({ ok: 1, error: '', ...body }); }

// Validate token (no change): GET /api/password?token=...
router.get('/', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const Resets = await col('PasswordResets');
    const now = new Date();
    const tok = await Resets.findOne({ token, used: false, expireAt: { $gt: now } });
    if (!tok) return res.status(400).json({ error: 'Invalid or expired token' });
    return ok(res, { mode: 'validate', message: 'Token is valid' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Explicit endpoints ----------

// Change password: POST /api/password/change  { login OR X-User-Id, oldPassword, newPassword }
router.post('/change', async (req, res) => {
  try {
    const { login, oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword required' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const Users = await col('Users');
    let query = null;

    // Prefer header X-User-Id, else login
    const uid = req.headers['x-user-id'];
    if (uid) { const _id = oid(uid); if (!_id) return res.status(400).json({ error: 'Invalid X-User-Id' }); query = { _id }; }
    else if (login) { query = { login: String(login).trim().toLowerCase() }; }
    else return res.status(400).json({ error: 'Provide login or X-User-Id' });

    const user = await Users.findOne(query, { projection: { _id: 1, passwordHash: 1 } });
    if (!user?.passwordHash) return res.status(404).json({ error: 'User not found' });

    const okOld = await bcrypt.compare(String(oldPassword), user.passwordHash);
    if (!okOld) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(String(newPassword), 10);
    await Users.updateOne({ _id: user._id }, { $set: { passwordHash: hash } });
    return ok(res, { mode: 'change', message: 'Password updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Request reset: POST /api/password/request  { login }
router.post('/request', async (req, res) => {
  try {
    const login = String(req.body?.login || '').trim().toLowerCase();
    if (!login) return res.status(400).json({ error: 'Missing login' });

    const Users  = await col('Users');
    const Resets = await col('PasswordResets');
    const user = await Users.findOne({ login }, { projection: { _id: 1, firstName: 1 } });

    const token   = crypto.randomBytes(32).toString('hex');
    const now     = new Date();
    const expires = new Date(now.getTime() + 3600 * 1000);

    if (user) {
      await Resets.insertOne({ userId: user._id, token, expireAt: expires, used: false, createdAt: now });
    }

    const base = process.env.RESET_BASE_URL
      || `${(req.headers['x-forwarded-proto'] || req.protocol) || 'http'}://${req.headers.host}/api/password`;
    const sep = base.includes('?') ? '&' : '?';
    const resetUrl = `${base}${sep}token=${token}`;

    if (user) {
      const first = String(user.firstName || 'there');
      const html = `<p>Hi ${first},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <p><a href="${resetUrl}">Reset my password</a></p>
        <p>This link expires in 1 hour.</p>`;
      await sendMail(login, 'Reset your password', html, process.env.FROM_EMAIL, process.env.FROM_NAME);
    }

    return ok(res, { mode: 'request', message: 'If this account exists, a reset link has been sent.', dev_resetLink: resetUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reset via token: POST /api/password/reset  { token, newPassword }
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const Users  = await col('Users');
    const Resets = await col('PasswordResets');
    const now = new Date();
    const tok = await Resets.findOne({ token: String(token), used: false, expireAt: { $gt: now } });
    if (!tok) return res.status(400).json({ error: 'Invalid or expired token' });

    const hash = await bcrypt.hash(String(newPassword), 10);
    await Users.updateOne({ _id: tok.userId }, { $set: { passwordHash: hash } });
    await Resets.updateOne({ _id: tok._id }, { $set: { used: true, usedAt: now } });

    return ok(res, { mode: 'reset', message: 'Password reset successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Back-compat single endpoint (optional) ----------
router.post('/', async (req, res) => {
  // keeps your earlier “3 modes in one POST /” behavior
  req.url = req.body?.token ? '/reset' : (req.body?.login && !req.body?.oldPassword ? '/request' : '/change');
  router.handle(req, res);
});

module.exports = router;

