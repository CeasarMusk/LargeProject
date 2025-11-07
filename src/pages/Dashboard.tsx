import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

type Tx = {
  _id: string;
  title: string;
  amount: number;
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  // Demo static data
  useEffect(() => {
    setTransactions([
      { _id: "1", title: "Paycheck", amount: 1000 },
      { _id: "2", title: "Groceries", amount: -50 },
      { _id: "3", title: "Gas", amount: -40 },
    ]);
  }, []);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  const addDemoTx = () => {
    if (!title || !amount) return;

    const newTx = {
      _id: Date.now().toString(),
      title,
      amount: Number(amount)
    };

    setTransactions([newTx, ...transactions]);
    setTitle("");
    setAmount("");
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Budget Buddy Dashboard</h2>

      <div className="mb-4">
        <input
          className="form-control mb-2"
          placeholder="Transaction title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="form-control mb-2"
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn btn-primary w-100" onClick={addDemoTx}>
          Add Transaction
        </button>
      </div>

      <h5>Recent Transactions</h5>
      <ul className="list-group mb-4">
        {transactions.map((tx) => (
          <li
            key={tx._id}
            className="list-group-item d-flex justify-content-between"
          >
            <span>{tx.title}</span>
            <strong style={{ color: tx.amount >= 0 ? "green" : "red" }}>
              {tx.amount >= 0 ? "+" : ""}
              {tx.amount}
            </strong>
          </li>
        ))}
      </ul>

      <div className="alert alert-info text-center">
        <h5>Total Balance:</h5>
        <strong>${total}</strong>
      </div>
    </div>
  );
}
