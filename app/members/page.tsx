import Shell from "@/components/Shell";
import MembersClient from "@/components/MembersClient";
import { getDB, safeMember } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireSession();
  const db = await getDB();
  const members = [...db.members]
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "coach" ? -1 : 1;
      return a.name.localeCompare(b.name, "ar");
    })
    .map(safeMember);

  return (
    <Shell>
      <MembersClient initial={members} />
    </Shell>
  );
}
