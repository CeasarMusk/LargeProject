const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

const {
  createSimpleTransaction,
  listSimpleTransactions,
  getSimpleSummary,
  deleteSimpleTransaction
} = require("../models/simpleTransaction");

// Require x-user-id on every request
router.use((req, res, next) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(400).json({ error: "userId is required" });
  req.userId = userId;
  next();
});

// POST /api/simple-transactions
router.post("/", async (req, res) => {
  try {
    const { name, amount } = req.body;

    if (!name) return res.status(400).json({ error: "name required" });
    if (amount === undefined)
      return res.status(400).json({ error: "amount required" });

    const item = await createSimpleTransaction({
      userId: req.userId,
      name,
      amount: Number(amount)
    });

    res.json(item);
  } catch (err) {
    console.error("Error creating simple transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simple-transactions
router.get("/", async (req, res) => {
  try {
    const items = await listSimpleTransactions(req.userId);
    res.json({ items });
  } catch (err) {
    console.error("Error listing simple transactions:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/simple-transactions/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await deleteSimpleTransaction(req.userId, id);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting simple transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simple-transactions/summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await getSimpleSummary(req.userId);
    res.json(summary);
  } catch (err) {
    console.error("Error getting simple summary:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
