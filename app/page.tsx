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
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Load expenses
  async function loadExpenses() {
    setLoading(true);

    const url =
      filter === ""
        ? "/api/expenses"
        : `/api/expenses?category=${filter}`;

    const res = await fetch(url);
    const data = await res.json();

    setExpenses(data);
    setLoading(false);
  }

  // Add expense
  async function addExpense(e: any) {
    e.preventDefault();

    // validation
    if (!form.amount || Number(form.amount) <= 0  || !form.category || !form.date) {
      alert("Please enter valid expense details");
      return;
    }

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

  // Reload when filter changes
  useEffect(() => {
    loadExpenses();
  }, [filter]);

  // Total calculation
  const total = expenses.reduce(
    (sum: number, e: any) => sum + Number(e.amount),
    0
  ).toFixed(2);

  const categories = ["Food", "Travel", "Rent", "Shopping", "Bills"];

  return (
    <main style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      <h1>Expense Tracker</h1>

      {/* TOTAL */}
      <h2>Total: ₹{total}</h2>

      {/* FILTER */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 10 }}
      >
        <option value="">All</option>
        <option value="Food">Food</option>
        <option value="Travel">Travel</option>
        <option value="Rent">Rent</option>
        <option value="Shopping">Shopping</option>
        <option value="Bills">Bills</option>
      </select>

      {/* LOADING */}
      {loading && <p>Loading...</p>}
      {/* FORM */}
      <form onSubmit={addExpense} style={{ marginBottom: 20 }}>
        <input
          placeholder="amount"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

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
        {expenses.length === 0 ? (
          <p>No expenses yet</p>
        ) : (
          expenses.map((e: any) => (
            <li key={e.id}>
              {e.category} - ₹{Number(e.amount).toFixed(2)}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}