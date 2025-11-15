// /var/www/server/src/routes/register.js
const express = require('express');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const router  = express.Router();
const { col } = require('../lib/mongo');

let sendMail = null;
try { ({ sendMail } = require('../lib/sendgrid')); } catch (_) {}

router.post('/', async (req, res) => {
  try {
    const { firstName = '', lastName = '', login = '', password = '' } = req.body || {};
    const first = String(firstName).trim();
    const last  = String(lastName).trim();
    const email = String(login).toLowerCase().trim();
    const pass  = String(password);

    if (!first || !last || !email || !pass) {
      return res.status(400).json({ error: 'Missing required field(s).' });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (pass.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const Users  = await col('Users');
    const Tokens = await col('EmailVerification');

    const passwordHash = await bcrypt.hash(pass, 10);

    // 1) Insert user (unverified)
    const userDoc = {
      firstName:  first,
      lastName:   last,
      login:      email,
      passwordHash,
      isVerified: false,
      createdAt:  new Date()
    };
    const ins = await Users.insertOne(userDoc);

    // 2) Create verification token (expires in 1 hour)
    const token   = crypto.randomBytes(32).toString('hex');
    const now     = new Date();
    const expires = new Date(now.getTime() + 3600 * 1000);

    await Tokens.insertOne({
      userId: ins.insertedId,
      token,
      expireAt:  expires,
      used:      false,
      createdAt: now
    });

    // 3) Build verify URL (prefer VERIFY_BASE_URL; else API endpoint)
    const base =
      process.env.VERIFY_BASE_URL ||
      `${(req.headers['x-forwarded-proto'] || req.protocol) || 'http'}://${req.headers.host}/api/email-verification`;
    const sep = base.includes('?') ? '&' : '?';
    const verifyUrl = `${base}${sep}token=${token}`;

    // 4) Send email if SendGrid is configured
    let mail = { ok: 0, error: 'Email not sent (SendGrid not configured)' };
    if (sendMail && process.env.SENDGRID_API_KEY) {
      try {
        const html = `<p>Hi ${first},</p>
          <p>Please verify your email by clicking the link below:</p>
          <p><a href="${verifyUrl}">Verify my email</a></p>
          <p>This link expires in 1 hour.</p>`;
        mail = await sendMail(
          email,
          'Verify your email',
          html,
          process.env.FROM_EMAIL || process.env.MAIL_FROM || 'noreply@example.com',
          process.env.FROM_NAME  || process.env.MAIL_FROM_NAME || 'Budget Manager'
        );
      } catch (err) {
        mail = { ok: 0, error: 'sendgrid: ' + err.message };
      }
    }

    const payload = {
      id: ins.insertedId.toString(),
      firstName: first,
      lastName:  last,
      error: ''
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.dev_verifyLink = verifyUrl;
      payload.mail = mail;
    }

    return res.json(payload);

  } catch (e) {
    if (e.code === 11000) {
      // If you want PHP-style behavior (HTTP 200), switch to:
      // return res.json({ error: 'Login already exists.' });
      return res.status(409).json({ error: 'Login already exists.' });
    }
    return res.status(500).json({ error: 'Insert failed: ' + e.message });
  }
});

module.exports = router;





  
