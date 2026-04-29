import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    const expenses = await prisma.expense.findMany({
      where: category ? { category } : {},
      orderBy: { date: "desc" },
    });

    return Response.json(expenses);
  } catch (err) {
    console.error("[GET /expenses] DB error:", err);
    return Response.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, category, description, date } = body as {
    amount: unknown;
    category: unknown;
    description: unknown;
    date: unknown;
  };

  // --- Validate amount ---
  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return Response.json(
      { error: "amount must be a positive number" },
      { status: 400 }
    );
  }

  // --- Validate category ---
  if (!category || typeof category !== "string" || category.trim() === "") {
    return Response.json(
      { error: "category must be a non-empty string" },
      { status: 400 }
    );
  }

  // --- Validate date ---
  if (!date || typeof date !== "string") {
    return Response.json({ error: "date is required" }, { status: 400 });
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return Response.json(
      { error: "date must be a valid ISO date string" },
      { status: 400 }
    );
  }

  // --- Idempotency ---
  // If the client sends an Idempotency-Key header we check for an existing
  // record with that key and return it instead of creating a duplicate.
  const idempotencyKey =
    req.headers.get("Idempotency-Key")?.trim() || null;

  if (idempotencyKey) {
    try {
      const existing = await prisma.expense.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return Response.json(existing, { status: 200 });
      }
    } catch (err) {
      console.error("[POST /expenses] idempotency lookup error:", err);
    }
  }

  // --- Create ---
  try {
    const expense = await prisma.expense.create({
      data: {
        amount: parsedAmount,
        category: category.trim(),
        description:
          description && typeof description === "string"
            ? description.trim()
            : "",
        date: parsedDate,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    return Response.json(expense, { status: 201 });
  } catch (err) {
    console.error("[POST /expenses] DB error:", err);
    return Response.json({ error: "Failed to save expense" }, { status: 500 });
  }
}