import { dayKey, getDB, saveDB, safeMember } from "@/lib/db";
import type { Attendance } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  const raw = body.code?.trim();
  if (!raw) return Response.json({ error: "لم يتم قراءة باركود" }, { status: 400 });

  const code = raw.replace(/^ghareeb[-:\s]*/i, "").trim();
  const db = await getDB();
  const member = db.members.find((item) => item.id === raw || item.id === code);
  if (!member) {
    return Response.json(
      { error: "الباركود غير معروف — راجع الكارت أو أعد إصداره من النظام" },
      { status: 404 },
    );
  }

  const today = dayKey(new Date().toISOString());
  const existing = db.attendance.find(
    (entry) => entry.memberId === member.id && dayKey(entry.at) === today,
  );
  if (existing) {
    return Response.json({
      member: safeMember(member),
      at: existing.at,
      alreadyCheckedIn: true,
    });
  }

  const entry: Attendance = {
    id: `a_${crypto.randomUUID().slice(0, 8)}`,
    memberId: member.id,
    at: new Date().toISOString(),
    method: "barcode",
  };
  db.attendance.push(entry);
  await saveDB(db);

  return Response.json({
    member: safeMember(member),
    at: entry.at,
    alreadyCheckedIn: false,
  });
}
