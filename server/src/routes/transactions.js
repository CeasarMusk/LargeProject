// /var/www/server/src/routes/transactions.js
const express = require('express');
const router  = express.Router();
const { col, oid } = require('../lib/mongo');

// ---------- helpers ----------
let idxEnsured = false;
async function ensureIdx() {
  if (idxEnsured) return;
  const Tx = await col('Transactions');
  try {
    await Tx.createIndex({ userId: 1, date: -1 });       // listing by recency
    await Tx.createIndex({ userId: 1, category: 1 });    // per-category queries
    await Tx.createIndex({ userId: 1, type: 1, date: -1 });
  } catch (_) {}
  idxEnsured = true;
}

function getUserId(req) {
  const idStr = req.body?.userId || req.query.userId || req.headers['x-user-id'];
  const id = oid(idStr);
  if (!id) throw new Error('Missing or invalid userId');
  return id;
}

function parseAmount(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount (must be > 0)');
  return n;
}

function parseType(t) {
  const s = String(t || '').toLowerCase().trim();
  if (s === 'income' || s === 'expense') return s;
  throw new Error('Invalid type (use "income" or "expense")');
}

function parseDate(v) {
  if (!v) return new Date();
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

function toISO(x) { return x ? new Date(x).toISOString() : x; }

function toPublic(d) {
  return {
    _id: String(d._id),
    userId: String(d.userId),
    amount: d.amount,
    type: d.type,
    category: d.category || '',
    description: d.description || '',
    paymentMethod: d.paymentMethod || '',
    period: d.period || 'monthly',
    date: toISO(d.date),
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

// Load the user's *single* budget for a given period (we enforce one per user+period)
async function loadBudgetForUser(userId, period = 'monthly') {
  const Budgets = await col('Budgets');
  // There is at most one per user+period by our Budgets route
  return Budgets.findOne({ userId, period });
}

// Find a category name in a budget (case-insensitive). Return exact stored name if found.
function matchCategoryName(input, budget) {
  const name = String(input || '').trim();
  if (!budget?.categories || !Array.isArray(budget.categories)) return null;

  // exact (case-insensitive) match
  const byCi = budget.categories.find(c => String(c.name).toLowerCase() === name.toLowerCase());
  if (byCi) return byCi.name;

  return null;
}

// Pick a valid expense category: try requested; otherwise fallback to "Other" if present; else error
function pickExpenseCategory(requested, budget) {
  const matched = matchCategoryName(requested, budget);
  if (matched) return matched;

  // fallback to "Other" if exists
  const other = budget?.categories?.find(
    c => String(c.name).toLowerCase() === 'other'
  );
  if (other) return other.name;

  throw new Error('Category not in budget (and no "Other" category found)');
}

// ---------- POST /api/transactions (create) ----------
router.post('/', async (req, res) => {
  try {
    await ensureIdx();
    const userId = getUserId(req);

    const type  = parseType(req.body?.type);
    const date  = parseDate(req.body?.date);
    const amount = parseAmount(req.body?.amount);
    const period = String(req.body?.period || 'monthly').toLowerCase().trim();

    // Load the user's budget for this period
    const budget = await loadBudgetForUser(userId, period);
    if (!budget) {
      return res.status(400).json({ error: `No ${period} budget found for this user` });
    }

    // Category rules:
    // - For expenses, enforce category ∈ budget.categories (fallback to "Other" if exists)
    // - For income, category is optional (we keep it if provided)
    let category = String(req.body?.category || '').trim();
    if (type === 'expense') {
      category = pickExpenseCategory(category, budget);
    } else if (category) {
      // normalize income category if it matches a budget category (optional)
      const m = matchCategoryName(category, budget);
      if (m) category = m;
    }

    const doc = {
      userId,
      amount,
      type,
      category,
      description:   String(req.body?.description || ''),
      paymentMethod: String(req.body?.paymentMethod || ''),
      period,                 // store which budget period this tx aligns with
      date,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const Tx = await col('Transactions');
    const r = await Tx.insertOne(doc);

    return res.json({ item: toPublic({ ...doc, _id: r.insertedId }), error: '' });
  } catch (e) {
    const msg = e.message || 'Server error';
    const status = /invalid|missing|use|budget|category/i.test(msg) ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
});

// ---------- GET /api/transactions?userId=...&limit=&offset=&type=&category=&from=&to= ----------
router.get('/', async (req, res) => {
  try {
    await ensureIdx();
    const userId = getUserId(req);

    const filter = { userId };

    // Optional filters
    if (req.query.type) {
      const t = parseType(req.query.type);
      filter.type = t;
    }
    if (req.query.category) {
      filter.category = String(req.query.category).trim();
    }
    if (req.query.period) {
      filter.period = String(req.query.period).toLowerCase().trim();
    }
    // date range
    const range = {};
    if (req.query.from) {
      const d = new Date(req.query.from);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid from date' });
      range.$gte = d;
    }
    if (req.query.to) {
      const d = new Date(req.query.to);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid to date' });
      range.$lt = d;
    }
    if (Object.keys(range).length) filter.date = range;

    const limit  = Math.max(1, Math.min(parseInt(req.query.limit || 50, 10), 200));
    const offset = Math.max(parseInt(req.query.offset || 0, 10), 0);

    const Tx = await col('Transactions');
    const cursor = Tx.find(filter).sort({ date: -1, _id: -1 }).skip(offset).limit(limit);
    const items = (await cursor.toArray()).map(toPublic);
    const nextOffset = items.length === limit ? offset + limit : null;

    return res.json({ items, limit, offset, nextOffset, error: '' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// ---------- DELETE /api/transactions/:id ----------
router.delete('/:id', async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: 'Invalid id' });
    const userId = getUserId(req);

    const Tx = await col('Transactions');
    const r = await Tx.deleteOne({ _id, userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Transaction not found' });

    return res.json({ ok: 1, deletedId: String(_id), error: '' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;

