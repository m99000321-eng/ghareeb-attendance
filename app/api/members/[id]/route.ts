import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import type { Role, Sport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    role?: Role;
    sport?: Sport;
    phone?: string;
  };

  const db = await getDB();
  const member = db.members.find((item) => item.id === id);
  if (!member) return Response.json({ error: "العضو غير موجود" }, { status: 404 });

  if (body.name?.trim()) member.name = body.name.trim();
  if (body.role === "coach" || body.role === "player") member.role = body.role;
  if (body.sport) member.sport = body.sport;
  if (typeof body.phone === "string") member.phone = body.phone.trim();

  await saveDB(db);
  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const { id } = await params;
  const db = await getDB();
  const index = db.members.findIndex((item) => item.id === id);
  if (index === -1) return Response.json({ error: "العضو غير موجود" }, { status: 404 });

  db.members.splice(index, 1);
  db.attendance = db.attendance.filter((entry) => entry.memberId !== id);
  await saveDB(db);
  return Response.json({ ok: true });
}
