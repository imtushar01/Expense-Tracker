"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Expense {
  id: string;
  amount: string | number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

const CATEGORIES = ["Food", "Travel", "Rent", "Shopping", "Bills"];

export default function Home() {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevents a stale in-flight request from overwriting a newer one
  const loadAbortRef = useRef<AbortController | null>(null);

  // Load expenses (with filter)
  const loadExpenses = useCallback(async () => {
    // Abort any in-flight load
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url =
        filter === ""
          ? "/api/expenses"
          : `/api/expenses?category=${encodeURIComponent(filter)}`;

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const data: Expense[] = await res.json();
      setExpenses(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Failed to load expenses"
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Reload whenever filter changes
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Add expense
  async function addExpense(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation (mirrors backend rules)
    const parsedAmount = Number(form.amount);
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }
    if (!form.category) {
      setError("Please select a category");
      return;
    }
    if (!form.date) {
      setError("Please select a date");
      return;
    }

    setError(null);
    setSubmitting(true);

    // Generate a per-submission idempotency key to prevent double-creates
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setForm({ amount: "", category: "", description: "", date: "" });
      // Await so the list is guaranteed fresh before re-enabling the form
      await loadExpenses();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to add expense"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Total of currently visible expenses only
  const total = expenses
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)
    .toFixed(2);

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
        disabled={loading}
      >
        <option value="">All</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* ERROR BANNER */}
      {error && (
        <p style={{ color: "red", margin: "8px 0" }} role="alert">
          {error}
        </p>
      )}

      {/* LOADING */}
      {loading && <p>Loading...</p>}

      {/* FORM */}
      <form onSubmit={addExpense} style={{ marginBottom: 20 }}>
        <fieldset disabled={submitting} style={{ border: "none", padding: 0 }}>
          <input
            id="amount"
            placeholder="Amount (₹)"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            id="description"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add Expense"}
          </button>
        </fieldset>
      </form>

      {/* LIST */}
      <ul>
        {!loading && expenses.length === 0 ? (
          <p>No expenses yet</p>
        ) : (
          expenses.map((e) => (
            <li key={e.id}>
              <strong>{e.category}</strong> — ₹
              {parseFloat(String(e.amount)).toFixed(2)}
              {e.description && <> · {e.description}</>}
              <br />
              <small>{new Date(e.date).toLocaleDateString()}</small>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}