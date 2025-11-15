// src/pages/transactions/Transactions.tsx

import { useEffect, useState } from "react";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction
} from "../../api/transactionsApi";

import { listBudgets } from "../../api/budgetsApi";

function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [budgets, setBudgets] = useState<any[]>([]);

  // form fields
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [date, setDate] = useState("");

  // filters
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  // edit support
  const [editId, setEditId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // load transactions
  const loadTransactions = async () => {
    try {
      const filters: any = {};

      if (filterType) filters.type = filterType;
      if (filterCategory) filters.category = filterCategory;
      if (filterPeriod) filters.period = filterPeriod;

      const result = await listTransactions(filters);
      setTransactions(result.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    }
    setLoading(false);
  };

  // load budgets for category info
  const loadBudgets = async () => {
    try {
      const result = await listBudgets({});
      setBudgets(result.items || []);
    } catch {}
  };

  useEffect(() => {
    loadBudgets();
    loadTransactions();
  }, []);

  // reload on filter change
  useEffect(() => {
    loadTransactions();
  }, [filterType, filterCategory, filterPeriod]);

  const resetForm = () => {
    setAmount("");
    setType("expense");
    setCategory("");
    setDescription("");
    setPaymentMethod("card");
    setDate("");
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        amount: Number(amount),
        type,
        category,
        description,
        paymentMethod,
        date
      };

      if (editId) {
        await updateTransaction(editId, payload);
        setMessage("Transaction updated");
      } else {
        await createTransaction(payload);
        setMessage("Transaction created");
      }

      resetForm();
      loadTransactions();
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const result = await getTransaction(id);
      const item = result.item;

      setEditId(id);
      setAmount(item.amount.toString());
      setType(item.type);
      setCategory(item.category);
      setDescription(item.description || "");
      setPaymentMethod(item.paymentMethod);
      setDate(item.date.split("T")[0]);
    } catch (err: any) {
      setError(err.message || "Failed to load transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction")) return;

    setError("");
    setMessage("");

    try {
      await deleteTransaction(id);
      setMessage("Transaction deleted");
      loadTransactions();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  const allCategories = Array.from(
    new Set(
      budgets.flatMap(b => b.categories.map((c: any) => c.name))
    )
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Transactions</h2>

      {error && <div style={{ color: "red", marginBottom: 15 }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: 15 }}>{message}</div>}

      {/* Filters */}
      <div style={{ marginBottom: 30 }}>
        <h3>Filters</h3>

        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">all types</option>
            <option value="expense">expense</option>
            <option value="income">income</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">all categories</option>
            {allCategories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
          >
            <option value="">any period</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
        <h3>{editId ? "Edit Transaction" : "Create Transaction"}</h3>

        <div style={{ marginBottom: 10 }}>
          <label>Amount</label>
          <input
            type="number"
            style={{ width: "100%", padding: 8 }}
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Type</label>
          <select
            style={{ width: "100%", padding: 8 }}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="expense">expense</option>
            <option value="income">income</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Category</label>
          <select
            style={{ width: "100%", padding: 8 }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">select category</option>
            {allCategories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Description</label>
          <input
            style={{ width: "100%", padding: 8 }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Payment Method</label>
          <select
            style={{ width: "100%", padding: 8 }}
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          >
            <option value="card">card</option>
            <option value="cash">cash</option>
            <option value="bank">bank</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Date</label>
          <input
            type="date"
            style={{ width: "100%", padding: 8 }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <button type="submit" style={{ padding: "8px 16px", marginRight: 10 }}>
          {editId ? "Save Changes" : "Create Transaction"}
        </button>

        {editId && (
          <button
            type="button"
            onClick={resetForm}
            style={{ padding: "8px 16px" }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Transactions list */}
      <h3>Existing Transactions</h3>

      {transactions.length === 0 && <div>No transactions found</div>}

      {transactions.map(t => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 12,
            borderRadius: 6
          }}
        >
          <div><strong>{t.type}</strong> — {t.amount}</div>
          <div>Category: {t.category}</div>
          <div>Description: {t.description || "none"}</div>
          <div>Payment: {t.paymentMethod}</div>
          <div>Date: {t.date.split("T")[0]}</div>

          <button
            onClick={() => handleEdit(t.id)}
            style={{ marginRight: 10, padding: "6px 12px" }}
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(t.id)}
            style={{ padding: "6px 12px", background: "red", color: "white" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Transactions;
