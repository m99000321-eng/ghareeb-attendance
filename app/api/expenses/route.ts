import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const db = await getDB();
  return Response.json({ expenses: db.expenses });
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    title?: string;
    amount?: number;
    category?: string;
    at?: string;
    note?: string;
  };

  const title = body.title?.trim();
  const amount = Number(body.amount);
  if (!title) return Response.json({ error: "اكتب بيان المصروف" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "اكتب مبلغ صحيح" }, { status: 400 });
  }

  const db = await getDB();
  const expense = {
    id: `e_${crypto.randomUUID().slice(0, 8)}`,
    title,
    amount,
    category: body.category?.trim() || "عام",
    at: body.at || new Date().toISOString(),
    note: body.note?.trim() ?? "",
  };
  db.expenses.push(expense);
  await saveDB(db);
  return Response.json({ expense }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const id = new URL(request.url).searchParams.get("id");
  const db = await getDB();
  const before = db.expenses.length;
  db.expenses = db.expenses.filter((item) => item.id !== id);
  if (db.expenses.length === before) {
    return Response.json({ error: "المصروف غير موجود" }, { status: 404 });
  }
  await saveDB(db);
  return Response.json({ ok: true });
}
