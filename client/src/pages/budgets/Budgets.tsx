// src/pages/budgets/Budgets.tsx

import { useEffect, useState } from "react";
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from "../../api/budgetsApi";

function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // form fields
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [total, setTotal] = useState("");
  const [categories, setCategories] = useState([{ name: "", allocation: "" }]);

  // editing
  const [editId, setEditId] = useState<string | null>(null);

  // messages
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // load budgets on mount
  const loadBudgets = async () => {
    try {
      const result = await listBudgets({});
      setBudgets(result.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load budgets");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  // handle add category row
  const addCategory = () => {
    setCategories([...categories, { name: "", allocation: "" }]);
  };

  // update category field
  const updateCategory = (index: number, field: string, value: string) => {
    const copy = [...categories];
    copy[index][field] = value;
    setCategories(copy);
  };

  // reset form
  const resetForm = () => {
    setName("");
    setPeriod("monthly");
    setTotal("");
    setCategories([{ name: "", allocation: "" }]);
    setEditId(null);
  };

  // submit new or edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // transform categories to correct structure
      const formatted = categories
        .filter(c => c.name.trim() !== "")
        .map(c => ({
          name: c.name.trim(),
          allocation: Number(c.allocation)
        }));

      if (editId) {
        await updateBudget(editId, {
          name,
          period,
          total: Number(total),
          categories: formatted
        });
        setMessage("Budget updated");
      } else {
        await createBudget({
          name,
          period,
          total: Number(total),
          categories: formatted
        });
        setMessage("Budget created");
      }

      resetForm();
      loadBudgets();
    } catch (err: any) {
      setError(err.message || "Failed to save budget");
    }
  };

  // start editing
  const handleEdit = (b: any) => {
    setEditId(b.id);
    setName(b.name);
    setPeriod(b.period);
    setTotal(b.limit.toString());

    const mapped = b.categories.map((c: any) => ({
      name: c.name,
      allocation: c.allocation.toString()
    }));

    setCategories(mapped.length ? mapped : [{ name: "", allocation: "" }]);
  };

  // delete with single alert
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this budget")) return;
    setError("");
    setMessage("");

    try {
      await deleteBudget(id);
      setMessage("Budget deleted");
      loadBudgets();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Budgets</h2>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
      )}
      {message && (
        <div style={{ color: "green", marginBottom: 10 }}>{message}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <h3>{editId ? "Edit Budget" : "Create Budget"}</h3>

        <div style={{ marginBottom: 10 }}>
          <label>Name</label>
          <input
            style={{ width: "100%", padding: 8 }}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Period</label>
          <select
            style={{ width: "100%", padding: 8 }}
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="monthly">monthly</option>
            <option value="weekly">weekly</option>
            <option value="yearly">yearly</option>
            <option value="custom">custom</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Total Allocation</label>
          <input
            type="number"
            style={{ width: "100%", padding: 8 }}
            value={total}
            onChange={e => setTotal(e.target.value)}
          />
        </div>

        <h4>Categories</h4>
        {categories.map((cat, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: 10, marginBottom: 10 }}
          >
            <input
              placeholder="name"
              value={cat.name}
              style={{ flex: 1, padding: 8 }}
              onChange={e => updateCategory(index, "name", e.target.value)}
            />
            <input
              placeholder="allocation"
              value={cat.allocation}
              type="number"
              style={{ width: 120, padding: 8 }}
              onChange={e =>
                updateCategory(index, "allocation", e.target.value)
              }
            />
          </div>
        ))}

        <button type="button" onClick={addCategory} style={{ marginBottom: 15 }}>
          Add Category
        </button>

        <div>
          <button
            type="submit"
            style={{ padding: "8px 16px", marginRight: 10 }}
          >
            {editId ? "Save Changes" : "Create Budget"}
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
        </div>
      </form>

      {/* Budget list */}
      <h3>Existing Budgets</h3>

      {budgets.length === 0 && <div>No budgets found</div>}

      {budgets.map(b => (
        <div
          key={b.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            borderRadius: 6
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {b.name} ({b.period})  
          </div>

          <div>Total: {b.limit}</div>

          <div style={{ marginTop: 10 }}>
            <strong>Categories:</strong>
            <ul>
              {b.categories.map((c: any, i: number) => (
                <li key={i}>
                  {c.name}: {c.allocation}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleEdit(b)}
            style={{ marginRight: 10, padding: "6px 12px" }}
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(b.id)}
            style={{ padding: "6px 12px", background: "red", color: "white" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Budgets;
