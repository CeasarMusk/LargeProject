const { getDb } = require("../lib/mongo");
const { ObjectId } = require("mongodb");

async function createSimpleTransaction({ userId, name, amount }) {
  const db = await getDb();

  const doc = {
    userId: new ObjectId(userId),
    name,
    amount,
    date: new Date()
  };

  const result = await db.collection("transactions_simple").insertOne(doc);

  return {
    id: result.insertedId.toString(),
    name: doc.name,
    amount: doc.amount,
    date: doc.date
  };
}

async function listSimpleTransactions(userId) {
  const db = await getDb();

  const docs = await db
    .collection("transactions_simple")
    .find({ userId: new ObjectId(userId) })
    .sort({ date: -1 })
    .toArray();

  return docs.map(d => ({
    id: d._id.toString(),
    name: d.name,
    amount: d.amount,
    date: d.date
  }));
}

async function getSimpleSummary(userId) {
  const items = await listSimpleTransactions(userId);

  let balance = 0;
  const expensesByName = {};

  for (const t of items) {
    balance += t.amount;

    if (t.amount < 0) {
      const key = t.name || "unknown";
      expensesByName[key] = (expensesByName[key] || 0) + Math.abs(t.amount);
    }
  }

  return {
    balance,
    expensesByName,
    items
  };
}
async function deleteSimpleTransaction(userId, id) {
  const db = await getDb();

  await db.collection("transactions_simple").deleteOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId)
  });

  return { ok: true };
}


module.exports = {
  createSimpleTransaction,
  listSimpleTransactions,
  getSimpleSummary,
  deleteSimpleTransaction
};

