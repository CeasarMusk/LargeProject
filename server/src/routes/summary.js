// /var/www/server/src/routes/summary.js
const express = require('express');
const router = express.Router();
const { col, oid } = require('../lib/mongo');

function requireUserId(req){
  const v = req.query.userId || req.headers['x-user-id'] || req.body?.userId;
  const id = oid(v);
  if (!id) throw new Error('userId is required');
  return id;
}
function dt(v){ return new Date(v); }
function iso(v){ return v ? new Date(v).toISOString() : v; }

// window for a given period; supports ?from&to overrides
function windowFor(period, fromQ, toQ){
  if (fromQ && toQ) return { start: dt(fromQ), end: dt(toQ) };
  const now = new Date();
  if (period === 'monthly'){
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1));
    return { start, end };
  }
  if (period === 'weekly'){
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay();
    const start = new Date(d); start.setUTCDate(d.getUTCDate() - ((day+6)%7)); // Mon
    const end   = new Date(start); end.setUTCDate(start.getUTCDate()+7);
    return { start, end };
  }
  if (period === 'yearly'){
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end   = new Date(Date.UTC(now.getUTCFullYear()+1, 0, 1));
    return { start, end };
  }
  const end = now, start = new Date(now.getTime() - 30*24*3600*1000);
  return { start, end };
}

router.get('/', async (req, res) => {
  try {
    const userId = requireUserId(req);
    const period = String(req.query.period || 'monthly').toLowerCase();
    const Budgets = await col('Budgets');

    // pick latest budget
    let budget;
    if (req.query.budgetId){
      const _id = oid(req.query.budgetId);
      if (!_id) return res.status(400).json({ error: 'Invalid budgetId' });
      budget = await Budgets.findOne({ _id, userId });
    } else {
      budget = await Budgets.findOne({ userId, period }, { sort: { updatedAt: -1 } });
    }

    // ---------- EMPTY USER RESPONSE (Solution B) ----------
    if (!budget) {
      return res.json({
        totals: {
          period: { start: null, end: null },
          budgeted: 0,
          spent: 0,
          remaining: 0,
          overspent: false,
          income: 0,
          expense: 0,
          net: 0
        },
        budget: null,
        categories: [],
        unknown: { mappedTo: 'Other', transactions: 0, amount: 0 },
        transactions: [],
        error: ''
      });
    }
    // --------------------------------------------------------

    // pick window
    const win = windowFor(period, req.query.from, req.query.to);
    if (budget.startDate && budget.endDate){
      win.start = new Date(budget.startDate);
      win.end   = new Date(budget.endDate);
    }

    const Tx = await col('Transactions');
    const tx = await Tx.find({
      userId,
      date: { $gte: win.start, $lt: win.end }
    }).sort({ date: -1, _id: -1 }).toArray();

    // totals income/expense/net
    let income = 0, expense = 0;
    for (const t of tx){
      const amt = Number(t.amount) || 0;
      if ((t.type||'').toLowerCase() === 'income') income += amt;
      else if ((t.type||'').toLowerCase() === 'expense') expense += amt;
    }
    const net = income - expense;

    const cats = Array.isArray(budget.categories) ? budget.categories : [];
    const map = new Map();
    for (const c of cats){
      const key = String(c.name||'').trim().toLowerCase();
      if (!key) continue;
      map.set(key, { name: c.name, allocation: Number(c.allocation)||0, spent: 0 });
    }
    if (!map.has('other')) map.set('other', { name: 'Other', allocation: 0, spent: 0 });

    let unknownCount = 0, unknownAmt = 0;
    for (const t of tx){
      if ((t.type||'').toLowerCase() !== 'expense') continue;
      const key = String(t.category||'').trim().toLowerCase();
      const row = map.get(key) || map.get('other');
      if (!map.has(key)) { unknownCount++; unknownAmt += Number(t.amount)||0; }
      row.spent += Number(t.amount)||0;
    }

    const categories = [];
    const seen = new Set();
    for (const c of cats){
      const key = String(c.name).toLowerCase();
      const row = map.get(key);
      const remaining = row.allocation - row.spent;
      categories.push({
        name: row.name,
        allocation: row.allocation,
        spent: +row.spent.toFixed(2),
        remaining: +remaining.toFixed(2),
        pctUsed: row.allocation > 0 ? +(100*row.spent/row.allocation).toFixed(2) : null,
        overspent: row.spent > row.allocation
      });
      seen.add(key);
    }
    if (!seen.has('other')){
      const row = map.get('other');
      categories.push({
        name: row.name,
        allocation: row.allocation,
        spent: +row.spent.toFixed(2),
        remaining: +(row.allocation - row.spent).toFixed(2),
        pctUsed: row.allocation > 0 ? +(100*row.spent/row.allocation).toFixed(2) : null,
        overspent: row.spent > row.allocation
      });
    }

    const spentFromCats = categories.reduce((s,c)=>s+c.spent,0);
    const totals = {
      period: { start: iso(win.start), end: iso(win.end) },
      budgeted: Number(budget.limit)||0,
      spent: +spentFromCats.toFixed(2),
      remaining: +((Number(budget.limit)||0) - spentFromCats).toFixed(2),
      overspent: spentFromCats > (Number(budget.limit)||0),
      income: +income.toFixed(2),
      expense: +expense.toFixed(2),
      net: +(net.toFixed(2))
    };

    const budgetOut = {
      _id: String(budget._id),
      name: budget.name,
      period: budget.period,
      limit: Number(budget.limit)||0,
      spent: totals.spent,
      remaining: totals.remaining,
      window: { start: totals.period.start, end: totals.period.end },
      createdAt: iso(budget.createdAt),
      updatedAt: iso(budget.updatedAt),
      startDate: iso(budget.startDate),
      endDate: iso(budget.endDate)
    };

    const txOut = tx.map(t => ({
      _id: String(t._id),
      userId: String(t.userId),
      amount: Number(t.amount)||0,
      type: t.type,
      category: t.category || '',
      description: t.description || '',
      date: iso(t.date),
      createdAt: iso(t.createdAt),
      updatedAt: iso(t.updatedAt)
    }));

    return res.json({
      totals,
      budget: budgetOut,
      categories,
      unknown: { mappedTo: 'Other', transactions: unknownCount, amount: +unknownAmt.toFixed(2) },
      transactions: txOut,
      error: ''
    });

  } catch (e) {
    const msg = e?.message || 'Server error';
    const status = /required|invalid/i.test(msg) ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
});

module.exports = router;
