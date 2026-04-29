# Expense Tracker

A personal expense tracking web app built with **Next.js 16 (App Router)**, **Prisma ORM**, **Neon (PostgreSQL)**, and **shadcn/ui**.

## Live Demo

Deployed on Vercel — [expense-tracker-imtushar01.vercel.app](ttps://expense-tracker-red-nine-80.vercel.app/)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier works)

### Install & Run

```bash
npm install

# Add your Neon connection string to .env
echo 'DATABASE_URL="postgresql://..."' > .env

npx prisma migrate deploy   # apply migrations to your DB
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- Add expenses with amount, category, description (optional), and date
- Filter expenses by category (Food, Travel, Rent, Shopping, Bills)
- Expenses always sorted newest-first
- Total reflects **only currently visible** (filtered) expenses
- Idempotency — duplicate submissions never create duplicate records
- Loading and error states throughout
- Submission lock — the form is disabled while a request is in flight

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Neon — serverless PostgreSQL |
| ORM | Prisma 6 |
| UI Library | shadcn/ui (Nova preset, Radix primitives) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Deployment | Vercel |

---

## API

### `GET /api/expenses`

Returns all expenses sorted by date descending.

| Query param | Type | Description |
|---|---|---|
| `category` | string | Filter by exact category name |

**Response:** `200 OK` — array of expense objects.

---

### `POST /api/expenses`

Creates a new expense.

**Headers:**

| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes | `application/json` |
| `Idempotency-Key` | Recommended | UUID per attempt — prevents duplicate saves on retry |

**Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `amount` | number | Yes | Must be a positive number |
| `category` | string | Yes | Must be a non-empty string |
| `date` | string | Yes | Valid ISO date (e.g. `YYYY-MM-DD`) |
| `description` | string | No | Free-text note |

**Response codes:**

| Status | Meaning |
|---|---|
| `201` | Expense created |
| `200` | Idempotent hit — existing expense returned |
| `400` | Validation error (see `error` field in body) |
| `500` | Unexpected server error |

---

## Persistence

Data is stored in **Neon** (serverless PostgreSQL) managed through Prisma ORM. The schema is in `prisma/schema.prisma`; migrations live in `prisma/migrations/`.

**Why Neon over SQLite?**
The app is deployed on Vercel, which runs on a read-only serverless filesystem. SQLite cannot write to disk in that environment. Neon is free, serverless-compatible, and requires zero infrastructure to operate.

---

## Idempotency Strategy

The frontend generates a `crypto.randomUUID()` per submission attempt and sends it in the `Idempotency-Key` request header.

The backend:
1. Looks up the key in the `idempotencyKey` column (unique index on `Expense`)
2. If found → returns the existing record immediately (HTTP 200)
3. If not found → creates and stores the record along with the key (HTTP 201)

This prevents duplicate rows from:
- Fast double-clicks on the submit button
- Network retries after a timeout
- Page refreshes mid-request

---

## Key Design Decisions

### 1. Route Handlers over Server Actions
The API is implemented as standard Next.js Route Handlers (`app/api/expenses/route.ts`) rather than Server Actions. This keeps the API decoupled and testable independently of the UI, and makes the idempotency-key header pattern straightforward to implement.

### 2. Idempotency-Key header (not hash-based deduplication)
The header approach puts deduplication control in the client, which is the industry standard (Stripe, Shopify, etc.). Hash-based dedup on field values would incorrectly block legitimately identical expenses (e.g. same coffee, same price, same day).

### 3. shadcn/ui with Tailwind v4
shadcn components are copied into the project rather than installed as a black-box library. This gives full control over styling and behaviour without runtime overhead, and plays well with Tailwind v4's CSS-variable–driven theming.

### 4. Client-side state + REST API
The frontend is a single `"use client"` page managing its own state and calling the REST API via `fetch`. This is the simplest correct architecture for this scope — no React Query, no global store, no server components for the list (which would complicate the filter/sort interaction).

### 5. `useCallback` + `AbortController` for data loading
`loadExpenses` is wrapped in `useCallback` so it can safely be listed in the `useEffect` dependency array. An `AbortController` is used to cancel in-flight requests when the filter changes rapidly, preventing a slow earlier request from overwriting the result of a faster later one.

---

## Trade-offs Made for the Timebox

| Trade-off | Reason |
|---|---|
| No authentication | Out of scope for a personal single-user tracker |
| No expense editing or deletion | Would require additional routes and UI; not listed in requirements |
| No pagination | Expense list assumed to stay manageable in scope |
| No optimistic UI | The list reloads from the server after each add; simpler and always consistent |
| Fixed category list (hardcoded) | A category management system adds significant complexity with no clear requirement |
| No test suite | Given the timebox, coverage was provided through manual verification and TypeScript's type system |

---

## Intentionally Not Done

- **Authentication / multi-user support** — no requirement for it; would need a session layer (NextAuth, Clerk, etc.)
- **Editing / deleting expenses** — not in the requirements
- **Charts / analytics** — nice-to-have but out of scope
- **Offline support / PWA** — not required
- **End-to-end tests** — would require Playwright/Cypress setup; validated manually instead
- **Dark mode toggle** — shadcn's theme system supports it natively but a UI toggle wasn't part of the scope

---

## Assumptions

- Single-user application; no auth required
- Categories are fixed: Food, Travel, Rent, Shopping, Bills
- `description` is optional; all other fields are required
- Neon free tier is sufficient (scales automatically, sleeps after inactivity — first request after sleep may be slow)
