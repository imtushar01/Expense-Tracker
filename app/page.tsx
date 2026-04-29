"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

  const [expenses, setExpenses] = useState([]);

  async function loadExpenses() {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(data);
  }

  async function addExpense(e: any) {
    e.preventDefault();

    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({
      amount: "",
      category: "",
      description: "",
      date: "",
    });

    loadExpenses();
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Expense Tracker</h1>

      {/* FORM */}
      <form onSubmit={addExpense} style={{ marginBottom: 20 }}>
        <input
          placeholder="amount"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <input
          placeholder="category"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        />

        <input
          placeholder="description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) =>
            setForm({ ...form, date: e.target.value })
          }
        />

        <button type="submit">Add Expense</button>
      </form>

      {/* LIST */}
      <ul>
        {expenses.map((e: any) => (
          <li key={e.id}>
            {e.category} - ₹{e.amount}
          </li>
        ))}
      </ul>
    </main>
  );
}