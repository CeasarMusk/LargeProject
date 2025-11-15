import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  addSimpleTransaction,
  listSimpleTransactions,
  getSimpleSummary,
  deleteSimpleTransaction
} from "../../api/simpleTransactionsApi";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import bg from "../../assets/background.png";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    const tx = await listSimpleTransactions();
    const sum = await getSimpleSummary();
    setTransactions(tx.items || []);
    setSummary(sum);
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    if (!name || !amount) return;

    await addSimpleTransaction({
      name,
      amount: Number(amount)
    });

    setName("");
    setAmount("");
    load();
  }

  async function handleDelete(id: string) {
    await deleteSimpleTransaction(id);
    load();
  }

  const expenseData =
    transactions
      .filter(t => t.amount < 0)
      .map(t => ({
        name: t.name,
        value: Math.abs(t.amount)
      }));

  const unusedMoney = summary?.balance > 0 ? summary.balance : 0;

  const pieData = [
    ...expenseData,
    { name: "Unused Money", value: unusedMoney }
  ];

  const COLORS = ["#FF7F50", "#1E90FF", "#FFD700", "#32CD32", "#DA70D6", "#87CEEB"];

  const total = pieData.reduce((sum, x) => sum + x.value, 0);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 40,
        fontFamily: "Inter, sans-serif"
      }}
    >

      {/* Logout pinned right */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10
        }}
      >
        <button
          onClick={logout}
          style={{
            background: "#e63946",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Logout
        </button>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: 10 }}>
        Budget Buddy
      </h1>

      {/* Add Transaction */}
      <div
        style={{
          marginTop: 30,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.85)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "900px"
        }}
      >
        <input
          type="text"
          placeholder="name (coffee, rent, salary)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="number"
          placeholder="amount (+ income - expense)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{
            width: "160px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={handleAdd}
          style={{
            padding: "10px 18px",
            background: "#1E90FF",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Add
        </button>
      </div>

      {/* Chart + Balance */}
      <div
        style={{
          marginTop: 40,
          padding: 25,
          borderRadius: "12px",
          border: "1px solid #ddd",
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "60px",
          width: "900px"
        }}
      >
        <div>
          <h2 style={{ marginBottom: 20, textAlign: "center" }}>Expenses Chart</h2>

          {/* FIX: wider chart + smaller labels to prevent cutoff */}
          <PieChart width={600} height={500}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="55%"
              cy="50%"
              outerRadius={140}
              labelLine={true}
              label={({ name, value }) => {
                const percent = ((value / total) * 100).toFixed(1);
                return `${name} ${percent}%`;
              }}
              labelStyle={{
                fontSize: "12px",
                fontWeight: 500
              }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "26px", marginBottom: 10 }}>Balance</h3>

          <strong
            style={{
              fontSize: "32px",
              color: summary?.balance >= 0 ? "green" : "red"
            }}
          >
            {summary?.balance ?? 0}
          </strong>

          <p style={{ marginTop: 10, fontSize: "15px", color: "#555" }}>
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div
        style={{
          marginTop: 40,
          padding: 30,
          borderRadius: "12px",
          border: "1px solid #ddd",
          background: "rgba(255,255,255,0.88)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          width: "900px"
        }}
      >
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>Transactions</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "16px"
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 4px", borderBottom: "2px solid #ddd" }}>Name</th>
              <th style={{ textAlign: "left", padding: "12px 4px", borderBottom: "2px solid #ddd" }}>Amount</th>
              <th style={{ textAlign: "center", padding: "12px 4px", borderBottom: "2px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, index) => (
              <tr
                key={t.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                }}
              >
                <td style={{ padding: "10px 4px" }}>{t.name}</td>
                <td style={{ padding: "10px 4px" }}>{t.amount}</td>
                <td style={{ padding: "10px 4px", textAlign: "center" }}>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{
                      background: "#e63946",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}














// import { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext";

// import {
//   addSimpleTransaction,
//   listSimpleTransactions,
//   getSimpleSummary,
//   deleteSimpleTransaction
// } from "../../api/simpleTransactionsApi";

// import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
// import bg from "../../assets/background.png";

// export default function Dashboard() {
//   const { user, logout } = useAuth();

//   const [name, setName] = useState("");
//   const [amount, setAmount] = useState("");
//   const [transactions, setTransactions] = useState<any[]>([]);
//   const [summary, setSummary] = useState<any>(null);

//   useEffect(() => {
//     if (!user) return;
//     load();
//   }, [user]);

//   async function load() {
//     const tx = await listSimpleTransactions();
//     const sum = await getSimpleSummary();
//     setTransactions(tx.items || []);
//     setSummary(sum);
//   }

//   async function handleAdd(e: any) {
//     e.preventDefault();
//     if (!name || !amount) return;

//     await addSimpleTransaction({
//       name,
//       amount: Number(amount)
//     });

//     setName("");
//     setAmount("");
//     load();
//   }

//   async function handleDelete(id: string) {
//     await deleteSimpleTransaction(id);
//     load();
//   }

//   const expenseData =
//     transactions
//       .filter(t => t.amount < 0)
//       .map(t => ({
//         name: t.name,
//         value: Math.abs(t.amount)
//       }));

//   const unusedMoney = summary?.balance > 0 ? summary.balance : 0;

//   const pieData = [
//     ...expenseData,
//     { name: "Unused Money", value: unusedMoney }
//   ];

//   const COLORS = ["#FF7F50", "#1E90FF", "#FFD700", "#32CD32", "#DA70D6", "#87CEEB"];

//   const total = pieData.reduce((sum, x) => sum + x.value, 0);

//   return (
//     <div
//       style={{
//         width: "100%",
//         minHeight: "100vh",
//         backgroundImage: `url(${bg})`,
//         backgroundSize: "cover",
//         backgroundRepeat: "no-repeat",
//         backgroundPosition: "center",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         padding: 40,
//         fontFamily: "Inter, sans-serif"
//       }}
//     >

//       {/* Logout pinned right */}
//       <div
//         style={{
//           width: "100%",
//           display: "flex",
//           justifyContent: "flex-end",
//           marginBottom: 10
//         }}
//       >
//         <button
//           onClick={logout}
//           style={{
//             background: "#e63946",
//             color: "white",
//             border: "none",
//             padding: "8px 16px",
//             borderRadius: "6px",
//             cursor: "pointer",
//             fontWeight: 600
//           }}
//         >
//           Logout
//         </button>
//       </div>

//       {/* Title */}
//       <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: 10 }}>
//         Budget Buddy
//       </h1>

//       {/* Add Transaction */}
//       <div
//         style={{
//           marginTop: 30,
//           padding: 20,
//           border: "1px solid #ddd",
//           borderRadius: "10px",
//           background: "rgba(255, 255, 255, 0.85)",
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           width: "900px"
//         }}
//       >
//         <input
//           type="text"
//           placeholder="name (coffee, rent, salary)"
//           value={name}
//           onChange={e => setName(e.target.value)}
//           style={{
//             flex: 1,
//             padding: "10px",
//             borderRadius: "6px",
//             border: "1px solid #ccc"
//           }}
//         />

//         <input
//           type="number"
//           placeholder="amount (+ income - expense)"
//           value={amount}
//           onChange={e => setAmount(e.target.value)}
//           style={{
//             width: "160px",
//             padding: "10px",
//             borderRadius: "6px",
//             border: "1px solid #ccc"
//           }}
//         />

//         <button
//           onClick={handleAdd}
//           style={{
//             padding: "10px 18px",
//             background: "#1E90FF",
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             cursor: "pointer",
//             fontWeight: 600
//           }}
//         >
//           Add
//         </button>
//       </div>

//       {/* Chart + Balance */}
//       <div
//         style={{
//           marginTop: 40,
//           padding: 25,
//           borderRadius: "12px",
//           border: "1px solid #ddd",
//           background: "rgba(255,255,255,0.85)",
//           boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           gap: "60px",
//           width: "900px"
//         }}
//       >
//         <div>
//           <h2 style={{ marginBottom: 20, textAlign: "center" }}>Expenses Chart</h2>

//           <PieChart width={420} height={420}>
//             <Pie
//               data={pieData}
//               dataKey="value"
//               nameKey="name"
//               cx="50%"
//               cy="50%"
//               outerRadius={130}
//               labelLine={true}
//               label={({ name, value }) => {
//                 const percent = ((value / total) * 100).toFixed(1);
//                 return `${name} ${percent}%`;
//               }}
//             >
//               {pieData.map((_, i) => (
//                 <Cell key={i} fill={COLORS[i % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </div>

//         <div style={{ textAlign: "center" }}>
//           <h3 style={{ fontSize: "26px", marginBottom: 10 }}>Balance</h3>

//           <strong
//             style={{
//               fontSize: "32px",
//               color: summary?.balance >= 0 ? "green" : "red"
//             }}
//           >
//             {summary?.balance ?? 0}
//           </strong>

//           <p style={{ marginTop: 10, fontSize: "15px", color: "#555" }}>
//             Unused money appears in the chart.
//           </p>
//         </div>
//       </div>

//       {/* Transactions */}
//       <div
//         style={{
//           marginTop: 40,
//           padding: 25,
//           borderRadius: "12px",
//           border: "1px solid #ddd",
//           background: "rgba(255,255,255,0.85)",
//           boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//           width: "900px"
//         }}
//       >
//         <h2 style={{ marginBottom: 20, textAlign: "center" }}>Transactions</h2>

//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "collapse",
//             fontSize: "16px"
//           }}
//         >
//           <thead>
//             <tr>
//               <th style={{ textAlign: "left", paddingBottom: 12, borderBottom: "2px solid #ddd" }}>Name</th>
//               <th style={{ textAlign: "left", paddingBottom: 12, borderBottom: "2px solid #ddd" }}>Amount</th>
//               <th style={{ textAlign: "center", paddingBottom: 12, borderBottom: "2px solid #ddd" }}>Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {transactions.map((t, index) => (
//               <tr
//                 key={t.id}
//                 style={{
//                   backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
//                 }}
//               >
//                 <td style={{ padding: "10px 0" }}>{t.name}</td>
//                 <td style={{ padding: "10px 0" }}>{t.amount}</td>
//                 <td style={{ padding: "10px 0", textAlign: "center" }}>
//                   <button
//                     onClick={() => handleDelete(t.id)}
//                     style={{
//                       background: "#e63946",
//                       color: "white",
//                       border: "none",
//                       padding: "6px 12px",
//                       borderRadius: "6px",
//                       cursor: "pointer"
//                     }}
//                   >
//                     delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//     </div>
//   );
// }
