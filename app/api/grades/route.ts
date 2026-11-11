import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const db = await getDB();
  return Response.json({ grades: db.grades });
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    memberId?: string;
    title?: string;
    score?: number;
    max?: number;
    at?: string;
  };

  const db = await getDB();
  const member = db.members.find((item) => item.id === body.memberId);
  if (!member) return Response.json({ error: "العضو غير موجود" }, { status: 404 });

  const title = body.title?.trim();
  const score = Number(body.score);
  const max = Number(body.max);
  if (!title) return Response.json({ error: "اكتب اسم الاختبار" }, { status: 400 });
  if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0 || score < 0 || score > max) {
    return Response.json({ error: "راجع الدرجة والدرجة النهائية" }, { status: 400 });
  }

  const grade = {
    id: `g_${crypto.randomUUID().slice(0, 8)}`,
    memberId: member.id,
    title,
    score,
    max,
    at: body.at || new Date().toISOString(),
  };
  db.grades.push(grade);
  await saveDB(db);
  return Response.json({ grade }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const id = new URL(request.url).searchParams.get("id");
  const db = await getDB();
  const before = db.grades.length;
  db.grades = db.grades.filter((item) => item.id !== id);
  if (db.grades.length === before) {
    return Response.json({ error: "الدرجة غير موجودة" }, { status: 404 });
  }
  await saveDB(db);
  return Response.json({ ok: true });
}
