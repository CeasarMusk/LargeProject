// /var/www/server/src/routes/emailVerification.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { col } = require('../lib/mongo');
const { sendMail } = require('../lib/sendgrid');

// POST /api/email-verification  { login: "user@example.com" }
router.post('/', async (req, res) => {
  try {
    const login = String(req.body?.login || '').trim().toLowerCase();
    if (!login) return res.status(400).json({ error: 'Missing login' });

    const Users  = await col('Users');
    const Tokens = await col('EmailVerification');

    const user = await Users.findOne(
      { login },
      { projection: { _id: 1, firstName: 1, isVerified: 1 } }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified === true) {
      return res.json({ ok: 1, message: 'Already verified', error: '' });
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const now     = new Date();
    const expires = new Date(now.getTime() + 3600 * 1000); // 1 hour

    await Tokens.insertOne({ userId: user._id, token, expireAt: expires, used: false, createdAt: now });

    const base = process.env.VERIFY_BASE_URL
      || `${(req.headers['x-forwarded-proto'] || req.protocol) || 'http'}://${req.headers.host}/api/email-verification`;
    const sep = base.includes('?') ? '&' : '?';
    const verifyUrl = `${base}${sep}token=${token}`;

    const first = String(user.firstName || 'there');
    const html = `<p>Hi ${first},</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 1 hour.</p>`;

    const mail = await sendMail(login, 'Verify your email', html, process.env.FROM_EMAIL, process.env.FROM_NAME);

    return res.json({ ok: 1, message: 'Verification email sent (or queued).', dev_verifyLink: verifyUrl, mail });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/email-verification?token=...   OR   /api/email-verification/:token
router.get('/:token?', async (req, res) => {
  try {
    const token = String(req.params.token || req.query.token || req.query.Token || '').trim();
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const Users  = await col('Users');
    const Tokens = await col('EmailVerification');

    const now = new Date();
    const tok = await Tokens.findOne({ token, used: false, expireAt: { $gt: now } });
    if (!tok) return res.status(400).json({ error: 'Invalid or expired token' });

    await Users.updateOne({ _id: tok.userId }, { $set: { isVerified: true, verifiedAt: now } });
    await Tokens.updateOne({ _id: tok._id }, { $set: { used: true, usedAt: now } });

    return res.json({ ok: 1, message: 'Email verified successfully', error: '' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
