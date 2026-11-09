import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDB();
  const attendance = [...db.attendance]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 300)
    .map((entry) => {
      const member = db.members.find((item) => item.id === entry.memberId);
      return {
        ...entry,
        name: member?.name ?? "عضو محذوف",
        role: member?.role ?? "player",
      };
    });
  return Response.json({ attendance });
}
