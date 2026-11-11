import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const db = await getDB();
  return Response.json({ subscriptions: db.subscriptions });
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    memberId?: string;
    month?: string;
    amount?: number;
    paid?: boolean;
    note?: string;
  };

  const db = await getDB();
  const member = db.members.find((item) => item.id === body.memberId);
  if (!member) return Response.json({ error: "العضو غير موجود" }, { status: 404 });
  if (!/^\d{4}-\d{2}$/.test(body.month ?? "")) {
    return Response.json({ error: "الشهر غير صحيح" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return Response.json({ error: "اكتب مبلغ صحيح" }, { status: 400 });
  }

  const paid = Boolean(body.paid);
  const existing = db.subscriptions.find(
    (item) => item.memberId === member.id && item.month === body.month,
  );
  if (existing) {
    existing.amount = amount;
    existing.paid = paid;
    existing.paidAt = paid ? existing.paidAt ?? new Date().toISOString() : undefined;
    existing.note = body.note?.trim() ?? existing.note;
    await saveDB(db);
    return Response.json({ subscription: existing });
  }

  const subscription = {
    id: `s_${crypto.randomUUID().slice(0, 8)}`,
    memberId: member.id,
    month: body.month!,
    amount,
    paid,
    paidAt: paid ? new Date().toISOString() : undefined,
    note: body.note?.trim() ?? "",
  };
  db.subscriptions.push(subscription);
  await saveDB(db);
  return Response.json({ subscription }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as { id?: string; paid?: boolean };
  const db = await getDB();
  const subscription = db.subscriptions.find((item) => item.id === body.id);
  if (!subscription) return Response.json({ error: "الاشتراك غير موجود" }, { status: 404 });

  subscription.paid = Boolean(body.paid);
  subscription.paidAt = subscription.paid ? new Date().toISOString() : undefined;
  await saveDB(db);
  return Response.json({ subscription });
}

export async function DELETE(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const id = new URL(request.url).searchParams.get("id");
  const db = await getDB();
  const before = db.subscriptions.length;
  db.subscriptions = db.subscriptions.filter((item) => item.id !== id);
  if (db.subscriptions.length === before) {
    return Response.json({ error: "الاشتراك غير موجود" }, { status: 404 });
  }
  await saveDB(db);
  return Response.json({ ok: true });
}
