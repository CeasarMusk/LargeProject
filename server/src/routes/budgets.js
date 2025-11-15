// server/src/routes/budgets.js
const express = require('express');
const router = express.Router();
const { col, oid } = require('../lib/mongo');

// --- helpers ---
const now = () => new Date();
const toIso = x => (x ? new Date(x).toISOString() : x);

function parseDateMaybe(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error('Invalid date format: ' + v);
  return d;
}
function requireUserIdFromAny(req) {
  const b = req.body || {};
  const idStr = b.userId || req.query.userId || req.headers['x-user-id'];
  if (!idStr) throw new Error('userId is required');
  const id = oid(idStr);
  if (!id) throw new Error('Invalid userId');
  return id;
}
function budgetToPublic(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    name: doc.name,
    // expose both (back-compat)
    limit: Number(doc.limit),
    total: Number(doc.limit),
    period: doc.period,
    startDate: toIso(doc.startDate),
    endDate: toIso(doc.endDate),
    categories: (doc.categories || []).map(c => ({ name: c.name, allocation: Number(c.allocation) })),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}
function normalizeCategories(raw) {
  if (!Array.isArray(raw) || raw.length === 0)
    throw new Error('categories is required and must be a non-empty array');
  const out = [];
  for (const c of raw) {
    const name = String(c?.name || '').trim();
    if (!name) throw new Error('Each category needs a non-empty name');
    const allocation = Number(c?.allocation);
    if (!Number.isFinite(allocation) || allocation < 0)
      throw new Error(`Invalid allocation for category '${name}'`);
    out.push({ name, allocation });
  }
  return out;
}
function assertAllocationsEqualTotal(categories, total) {
  const sum = categories.reduce((s, c) => s + Number(c.allocation || 0), 0);
  if (Math.abs(sum - Number(total)) > 0.005)
    throw new Error(`Category allocations (${sum}) must equal total (${total})`);
}

// indexes
let indexesEnsured = false;
async function ensureBudgetIndexes() {
  if (indexesEnsured) return;
  const Budgets = await col('Budgets');
  try {
    await Budgets.createIndex({ userId: 1, period: 1 }, { name: 'user_period' });
    await Budgets.createIndex({ userId: 1, updatedAt: -1 }, { name: 'user_updated' });
    await Budgets.createIndex({ userId: 1, name: 1 }, { name: 'user_name' });
  } catch (_) {}
  indexesEnsured = true;
}

// ------- GET: list or single -------
router.get('/:id?', async (req, res) => {
  try {
    await ensureBudgetIndexes();
    const userId = requireUserIdFromAny(req);

    const id = req.params.id || req.query.id || null;
    if (id) {
      const _id = oid(id);
      if (!_id) return res.status(400).json({ error: 'Invalid id' });
      const Budgets = await col('Budgets');
      const doc = await Budgets.findOne({ _id, userId });
      if (!doc) return res.status(404).json({ error: 'Budget not found' });
      return res.json({ item: budgetToPublic(doc), error: '' });
    }

    const Budgets = await col('Budgets');
    const filter = { userId };
    if (req.query.period) filter.period = String(req.query.period).toLowerCase().trim();
    if (req.query.q) filter.name = { $regex: String(req.query.q), $options: 'i' };

    const limit = Math.max(1, Math.min(parseInt(req.query.limit || 20, 10), 100));
    const offset = Math.max(parseInt(req.query.offset || 0, 10), 0);

    const cursor = Budgets.find(filter, { skip: offset, limit, sort: { updatedAt: -1 } });
    const items = (await cursor.toArray()).map(budgetToPublic);
    const nextOffset = items.length === limit ? offset + limit : null;

    res.json({ items, limit, offset, nextOffset, error: '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ------- POST: create (one per user+period) -------
router.post('/', async (req, res) => {
  try {
    await ensureBudgetIndexes();
    const inb = req.body || {};
    const userId = requireUserIdFromAny(req);

    const name   = String(inb.name || 'Main').trim();
    const period = String(inb.period || 'monthly').toLowerCase().trim();
    if (!['monthly', 'weekly', 'yearly', 'custom'].includes(period))
      return res.status(400).json({ error: 'Invalid period; use monthly, weekly, yearly, or custom' });

    const totalRaw = (inb.total !== undefined ? inb.total : inb.limit);
    const total = Number(totalRaw);
    if (!Number.isFinite(total) || total < 0)
      return res.status(400).json({ error: 'total/limit must be a non-negative number' });

    const categories = normalizeCategories(inb.categories);
    assertAllocationsEqualTotal(categories, total);

    const Budgets = await col('Budgets');
    const existing = await Budgets.findOne({ userId, period });
    if (existing) return res.status(409).json({ error: `A ${period} budget already exists for this user` });

    const doc = {
      userId, name, limit: total, period,
      categories,
      startDate: ('startDate' in inb) ? parseDateMaybe(inb.startDate) : null,
      endDate:   ('endDate'   in inb) ? parseDateMaybe(inb.endDate)   : null,
      createdAt: now(), updatedAt: now()
    };

    const r = await Budgets.insertOne(doc);
    doc._id = r.insertedId;
    res.json({ item: budgetToPublic(doc), error: '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ------- PATCH / PUT: update -------
router.patch('/:id', updateBudget);
router.put('/:id', updateBudget);
async function updateBudget(req, res) {
  try {
    await ensureBudgetIndexes();
    const inb = req.body || {};
    const id = req.params.id || inb.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const _id = oid(id);
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    const userId = requireUserIdFromAny(req);
    const set = {};

    if ('name' in inb) {
      const v = String(inb.name || '').trim();
      if (!v) return res.status(400).json({ error: 'name cannot be empty' });
      set.name = v;
    }
    if ('total' in inb || 'limit' in inb) {
      const n = Number('total' in inb ? inb.total : inb.limit);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: 'total/limit must be a non-negative number' });
      set.limit = n;
    }
    if ('period' in inb) {
      const p = String(inb.period || '').toLowerCase().trim();
      if (!['monthly', 'weekly', 'yearly', 'custom'].includes(p))
        return res.status(400).json({ error: 'Invalid period; use monthly, weekly, yearly, or custom' });
      const Budgets = await col('Budgets');
      const other = await Budgets.findOne({ _id: { $ne: _id }, userId, period: p });
      if (other) return res.status(409).json({ error: `A ${p} budget already exists for this user` });
      set.period = p;
    }
    if ('startDate' in inb) set.startDate = parseDateMaybe(inb.startDate);
    if ('endDate'   in inb) set.endDate   = parseDateMaybe(inb.endDate);

    if ('categories' in inb) {
      const cats = normalizeCategories(inb.categories);
      const Budgets = await col('Budgets');
      const cur = await Budgets.findOne({ _id, userId }, { projection: { limit: 1 } });
      if (!cur) return res.status(404).json({ error: 'Budget not found' });
      const total = ('limit' in set) ? set.limit : cur.limit;
      assertAllocationsEqualTotal(cats, total);
      set.categories = cats;
    }

    if (!Object.keys(set).length) return res.status(400).json({ error: 'No fields to update' });
    set.updatedAt = now();

    const Budgets = await col('Budgets');
    const r = await Budgets.updateOne({ _id, userId }, { $set: set });
    if (r.matchedCount === 0) return res.status(404).json({ error: 'Budget not found' });

    const doc = await Budgets.findOne({ _id, userId });
    res.json({ item: budgetToPublic(doc), error: '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ------- DELETE -------
router.delete('/:id', async (req, res) => {
  try {
    await ensureBudgetIndexes();
    const id = req.params.id || req.query.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const _id = oid(id);
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    const userId = requireUserIdFromAny(req);
    const Budgets = await col('Budgets');

    const r = await Budgets.deleteOne({ _id, userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Budget not found' });

    res.json({ ok: 1, deletedId: String(_id), error: '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
