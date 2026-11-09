import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import type { Attendance } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const { id } = await params;
  const db = await getDB();
  const member = db.members.find((item) => item.id === id);
  if (!member) return Response.json({ error: "العضو غير موجود" }, { status: 404 });

  const attendance: Attendance = {
    id: `a_${crypto.randomUUID().slice(0, 8)}`,
    memberId: id,
    at: new Date().toISOString(),
    method: "manual",
  };
  db.attendance.push(attendance);
  await saveDB(db);

  return Response.json({ ok: true, attendance });
}
