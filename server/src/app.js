// /var/www/server/src/app.js
require('dotenv').config();
const express = require('express');
// CORS removed because nginx handles all CORS now
// const cors = require('cors');
const { ensureIndexes } = require('./lib/mongo');

const app = express();
app.set('trust proxy', true);

// No backend CORS. Nginx handles it.
// app.use(cors({
//   origin(origin, callback) {
//     if (!origin) return callback(null, true); // allow postman etc
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
// }));

app.use(express.json());
app.use('/api/simple-transactions', require('./routes/simpleTransaction'));


// Simple request log
app.use((req, _res, next) => { console.log(req.method, req.url); next(); });

// Health
app.get('/health', (_req, res) => res.json({ ok: 1 }));
app.get('/api/health', (_req, res) => res.json({ ok: 1 }));

// Routes
app.use('/api/register',           require('./routes/register'));
app.use('/api/login',              require('./routes/login'));

// Primary email verification mount
const emailVerificationRouter = require('./routes/emailVerification');
app.use('/api/email-verification', emailVerificationRouter);

// Alias mounts to handle legacy links
app.use('/api/emailverification',  emailVerificationRouter);  // no hyphen
app.use('/EmailVerification.php',  emailVerificationRouter);  // legacy PHP path
app.use('/email-verification',     emailVerificationRouter);  // non-API direct hit
app.use('/emailverification',      emailVerificationRouter);  // non-API, no hyphen

app.use('/api/password',           require('./routes/password'));
app.use('/api/transactions',       require('./routes/transactions'));
app.use('/api/budgets',            require('./routes/budgets'));
app.use('/api/summary',            require('./routes/summary'));
app.use('/api/users',              require('./routes/users'));

// 404 JSON
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('ERR', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: err?.message || 'Server error' });
});

const port = process.env.PORT || 5001;
(async () => {
  app.listen(port, () => console.log(`API running on :${port}`));
  try { 
    await ensureIndexes();
    console.log('DB connected and indexes ensured');
  } catch (err) {
    console.error('DB init failed:', err?.message || err);
  }

  process.on('unhandledRejection', e => console.error('unhandledRejection', e));
  process.on('uncaughtException',  e => console.error('uncaughtException', e));
})();
