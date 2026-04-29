"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  IndianRupee,
  Loader2,
  PlusCircle,
  Receipt,
  Tag,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  amount: string | number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

const CATEGORIES = ["Food", "Travel", "Rent", "Shopping", "Bills"];

const CATEGORY_STYLES: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  Travel:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  Rent: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  Shopping:
    "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  Bills:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

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

  const loadAbortRef = useRef<AbortController | null>(null);

  const loadExpenses = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();

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
      await loadExpenses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  const total = expenses
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)
    .toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary p-2 shadow">
              <Wallet className="size-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Expense Tracker
            </h1>
          </div>
          <p className="text-sm text-muted-foreground pl-1">
            Track and manage your personal expenses
          </p>
        </div>

        {/* ── Total stat card ── */}
        <Card className="bg-primary text-primary-foreground shadow-lg border-0">
          <CardContent className="flex items-center justify-between py-5">
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-80">
                {filter ? `Total · ${filter}` : "Total · All expenses"}
              </p>
              <p className="text-4xl font-bold tracking-tight">₹{total}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <IndianRupee className="size-8 opacity-90" />
            </div>
          </CardContent>
        </Card>

        {/* ── Category filter pills ── */}
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((cat) => {
            const value = cat === "All" ? "" : cat;
            const active = filter === value;
            return (
              <button
                key={cat}
                onClick={() => setFilter(value)}
                disabled={loading}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Add expense form ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlusCircle className="size-4" />
              Add Expense
            </CardTitle>
            <CardDescription>
              Fill in the details to record a new expense
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addExpense} className="space-y-4">
              <fieldset disabled={submitting} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(val) =>
                        setForm({ ...form, category: val })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional note"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 size-4" />
                      Add Expense
                    </>
                  )}
                </Button>
              </fieldset>
            </form>
          </CardContent>
        </Card>

        {/* ── Expense list ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-4" />
                Recent Expenses
              </CardTitle>
              {expenses.length > 0 && (
                <Badge variant="secondary">{expenses.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Receipt className="size-10 opacity-30" />
                <p className="text-sm">No expenses yet. Add one above!</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {expenses.map((expense, idx) => (
                  <li
                    key={expense.id}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 gap-4 transition-colors hover:bg-muted/50",
                      idx === 0 && "rounded-t-none",
                      idx === expenses.length - 1 && "rounded-b-xl"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium",
                          CATEGORY_STYLES[expense.category] ??
                            "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {expense.category}
                      </span>
                      <div className="min-w-0">
                        {expense.description && (
                          <p className="text-sm font-medium truncate">
                            {expense.description}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {new Date(expense.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      ₹{parseFloat(String(expense.amount)).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}