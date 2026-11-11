import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const db = await getDB();
  return Response.json({ announcements: db.announcements });
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    title?: string;
    body?: string;
    group?: string;
  };

  const title = body.title?.trim();
  const text = body.body?.trim();
  if (!title || !text) {
    return Response.json({ error: "اكتب عنوان ونص التنبيه" }, { status: 400 });
  }

  const db = await getDB();
  const announcement = {
    id: `n_${crypto.randomUUID().slice(0, 8)}`,
    title,
    body: text,
    group: body.group?.trim() ?? "",
    at: new Date().toISOString(),
  };
  db.announcements.push(announcement);
  await saveDB(db);
  return Response.json({ announcement }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const id = new URL(request.url).searchParams.get("id");
  const db = await getDB();
  const before = db.announcements.length;
  db.announcements = db.announcements.filter((item) => item.id !== id);
  if (db.announcements.length === before) {
    return Response.json({ error: "التنبيه غير موجود" }, { status: 404 });
  }
  await saveDB(db);
  return Response.json({ ok: true });
}
