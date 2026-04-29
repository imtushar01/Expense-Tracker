# Expense Tracker

A personal expense tracking web app built with **Next.js 16 (App Router)**, **Prisma**, and **SQLite**.

## Features

- Add expenses with amount, category, optional description, and date
- Filter expenses by category
- Expenses are always sorted newest-first
- Total reflects only currently visible (filtered) expenses
- Duplicate-submission protection via idempotency keys

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
npm install
npx prisma migrate deploy   # apply DB migrations (creates prisma/dev.db)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Persistence

Expenses are persisted in a **SQLite database** (`prisma/dev.db`) managed by Prisma ORM.

The schema is defined in `prisma/schema.prisma`. Migrations live in `prisma/migrations/`.

## API

### `GET /api/expenses`

Returns all expenses sorted by date descending.

**Query params:**

| Param      | Type   | Description                        |
|------------|--------|------------------------------------|
| `category` | string | Filter by exact category name      |

**Response:** `200 OK` — array of expense objects.

---

### `POST /api/expenses`

Creates a new expense.

**Headers:**

| Header            | Required | Description                                     |
|-------------------|----------|-------------------------------------------------|
| `Content-Type`    | Yes      | `application/json`                              |
| `Idempotency-Key` | No       | A unique string per submission attempt (UUID recommended). Identical keys return the original expense without creating a duplicate. |

**Body (JSON):**

| Field         | Type   | Required | Description                       |
|---------------|--------|----------|-----------------------------------|
| `amount`      | number | Yes      | Must be a positive number         |
| `category`    | string | Yes      | Must be a non-empty string        |
| `date`        | string | Yes      | ISO date string (e.g. YYYY-MM-DD) |
| `description` | string | No       | Optional free-text note           |

**Responses:**

| Status | Meaning                                     |
|--------|---------------------------------------------|
| 201    | Expense created                             |
| 200    | Idempotent — returned existing expense      |
| 400    | Validation error (see `error` field)        |
| 500    | Unexpected server error                     |

## Idempotency Strategy

The frontend generates a `crypto.randomUUID()` per submission and sends it as the `Idempotency-Key` header.

The backend stores the key in a `idempotencyKey` column (unique index) on the `Expense` table. If a request arrives with a key that already exists, the existing record is returned immediately — **no duplicate is ever written**.

This protects against:
- Double form submissions (fast double-click)
- Network retries after timeout
- Page refresh mid-request

## Assumptions

- Single-user app; no authentication required.
- Categories are a fixed list: Food, Travel, Rent, Shopping, Bills.
- `description` is optional; all other fields are required.
- SQLite is sufficient for local/single-server deployments.
