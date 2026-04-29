import { prisma } from "@/lib/prisma";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });

  return Response.json(expenses);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { amount, category, description, date } = body;

  if (!amount || !category || !date) {
    return Response.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      amount,
      category,
      description,
      date: new Date(date),
    },
  });

  return Response.json(expense);
}